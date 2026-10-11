// Exercises the first-mount ref timing that pure geometry tests cannot cover.
// The fixture is test-only; this never modifies the live scheduler.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const pause = milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds))
const profile = await mkdtemp(join(tmpdir(),'starflow-connections-'))
const server = await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'silent',server:{host:'127.0.0.1',port:0}})
let browser, socket
try {
  await server.listen()
  const executable = process.env.STARFLOW_CHROME_BIN || (process.platform==='darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome')
  const webgl = process.env.STARFLOW_BROWSER_WEBGL==='1'
  browser = spawn(executable,['--headless=new',`--user-data-dir=${profile}`,'--remote-debugging-port=0','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync',...(webgl ? [] : ['--disable-webgl']),'--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','about:blank'],{stdio:['ignore','ignore','pipe']})
  // Avoid software WebGL in CI; the separate 3D projection test covers fittings.
  const browserEndpoint = await new Promise((resolve,reject) => {
    let stderr = ''
    const timeout = setTimeout(() => reject(new Error(`Chrome did not start: ${stderr}`)),30000)
    browser.on('error',error => { clearTimeout(timeout); reject(error) })
    browser.once('exit',code => { clearTimeout(timeout); reject(new Error(`Chrome exited (${code}): ${stderr}`)) })
    browser.stderr.on('data',chunk => {
      stderr = (stderr+chunk.toString()).slice(-1800)
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/)
      if (match) { clearTimeout(timeout); resolve(match[1]) }
    })
  })
  const debugOrigin = new URL(browserEndpoint); debugOrigin.protocol = 'http:'
  const target = await fetch(new URL('/json/new?about:blank',debugOrigin),{method:'PUT'}).then(response => response.json())
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve,reject) => { socket.onopen=resolve; socket.onerror=reject })
  let sequence = 0
  const pending = new Map(), exceptions = [], delayedTextures = []
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.method==='Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (message.method==='Fetch.requestPaused') delayedTextures.push(message.params.requestId)
    if (!message.id) return
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(JSON.stringify(message.error)))
    else request.resolve(message.result)
  }
  const send = (method,params={}) => new Promise((resolve,reject) => {
    const id = ++sequence
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Chrome timed out: ${method}`)) },15000)
    pending.set(id,{resolve:value => { clearTimeout(timeout); resolve(value) },reject:error => { clearTimeout(timeout); reject(error) }})
    socket.send(JSON.stringify({id,method,params}))
  })
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate',{expression,returnByValue:true})
    assert.equal(response.exceptionDetails,undefined)
    return response.result.value
  }
  await send('Page.enable'); await send('Runtime.enable')
  if (webgl) await send('Fetch.enable',{patterns:[{urlPattern:'*station-metal-v2.jpg*',requestStage:'Request'}]})
  await send('Page.bringToFront'); await send('Emulation.setFocusEmulationEnabled',{enabled:true})
  await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1100,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:new URL('tests/request-connections.preview.html?four',server.resolvedUrls.local[0]).href})
  for (let attempt=0; attempt<50; attempt++) {
    await pause(100)
    if (await evaluate('document.querySelectorAll(".request-channel").length===4')) break
  }
  const inspect = () => evaluate(`(() => {
    const console=document.querySelector('.orbital-console'), svg=console.querySelector('.request-paths'), origin=console.getBoundingClientRect()
    return {count:svg.querySelectorAll('.request-channel').length,routes:Array.from(svg.querySelectorAll('[data-route-id]')).map((path,index) => {
      const source=Array.from(console.querySelectorAll('[data-agent-module]')).find(element=>element.dataset.agentModule===path.dataset.routeId).querySelector('[data-agent-port]').getBoundingClientRect()
      const dock=console.querySelector('[data-station-port="'+index+'"]').getBoundingClientRect()
      const start=path.getPointAtLength(0), end=path.getPointAtLength(path.getTotalLength())
      return {d:path.getAttribute('d'),length:path.getTotalLength(),sourceError:Math.hypot(start.x-(source.left+source.width/2-origin.left),start.y-(source.top+source.height/2-origin.top)),dockError:Math.hypot(end.x-(dock.left+dock.width/2-origin.left),end.y-(dock.top+dock.height/2-origin.top))}
    })}
  })()`)
  const check = async () => {
    const result = await inspect()
    assert.equal(result.count,4,'all four selected services connect on first mount')
    assert.equal(result.routes.length,4)
    for (const route of result.routes) {
      assert.ok(route.length>30)
      assert.ok(route.sourceError<.25,`line touches the service fitting (${route.sourceError}px)`)
      assert.ok(route.dockError<.25,`line touches the moving station fitting (${route.dockError}px)`)
    }
    const labels = await evaluate(`(() => {
      const word=document.querySelector('.station-core-label strong').getBoundingClientRect()
      const band=document.querySelector('.scheduler-band').getBoundingClientRect()
      const text=document.querySelector('.scheduler-wordmark').getBoundingClientRect()
      return {separated:word.bottom<band.top,contained:text.left>=band.left && text.right<=band.right,text:document.querySelector('.scheduler-wordmark').textContent}
    })()`)
    assert.ok(labels.separated,'Gemini does not overlap the scheduler label')
    assert.ok(labels.contained,'scheduler lettering fits the physical band')
    assert.equal(labels.text,'StarFlow scheduler')
    return result
  }
  await check()
  if (webgl) {
    // Hold the real texture request to reproduce a slow renderer startup. The
    // previous image must never appear while the current model initializes.
    for (let attempt=0;attempt<100 && !delayedTextures.length;attempt++) await pause(100)
    assert.ok(delayedTextures.length,'station texture request is held for the loading regression')
    const loading = () => evaluate(`(() => {
      const stage=document.querySelector('.station-stage'), bounds=stage.getBoundingClientRect()
      return {renderer:stage.dataset.renderer,busy:stage.getAttribute('aria-busy'),legacy:stage.querySelectorAll('.station-render').length,loading:stage.querySelectorAll('.station-loading i').length,width:bounds.width,height:bounds.height,canvasOpacity:getComputedStyle(stage.querySelector('canvas')).opacity}
    })()`)
    const before = await loading(); await pause(500); const during = await loading()
    assert.equal(during.renderer,'loading')
    assert.equal(during.busy,'true')
    assert.equal(during.legacy,0,'the old station image is absent during initialization')
    assert.equal(during.canvasOpacity,'0','an unfinished WebGL frame stays hidden')
    assert.equal(during.loading,3)
    assert.ok(Math.abs(before.width-during.width)<.25); assert.ok(Math.abs(before.height-during.height)<.25)
    for (const requestId of delayedTextures) await send('Fetch.continueRequest',{requestId})
    await send('Fetch.disable')
    for (let attempt=0;attempt<100;attempt++) {
      if (await evaluate('document.querySelector(".station-stage").dataset.renderer === "3d"')) break
      await pause(100)
    }
    assert.ok(await evaluate('document.querySelector(".station-stage").dataset.renderer === "3d"'),'native 3D station initializes')
    const after = await loading()
    assert.equal(after.legacy,0,'the old station image is absent after the current model appears')
    assert.equal(after.loading,0); assert.equal(after.busy,'false')
    assert.ok(Math.abs(during.width-after.width)<.25); assert.ok(Math.abs(during.height-after.height)<.25)
  } else {
    for (let attempt=0;attempt<50;attempt++) {
      if (await evaluate('document.querySelector(".station-stage").dataset.renderer === "fallback"')) break
      await pause(100)
    }
    assert.ok(await evaluate('document.querySelector(".station-stage").dataset.renderer === "fallback"'),'unsupported WebGL still has an explicit fallback')
  }
  for (const width of [1440,1024,390,1920]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<761})
    // A resize commits CSS layout, ResizeObserver and React state on separate
    // frames. Wait for those commits instead of racing the headless compositor.
    for (let attempt=0; attempt<40; attempt++) {
      await pause(100)
      const result = await inspect()
      if (result.routes.length===4 && result.routes.every(route=>route.sourceError<.25 && route.dockError<.25)) break
    }
    const first = await check()
    const overflow = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,wide:Array.from(document.querySelectorAll('body *')).map(node=>({name:node.tagName,classes:node.getAttribute('class'),right:node.getBoundingClientRect().right,left:node.getBoundingClientRect().left})).filter(node=>node.right>innerWidth+1 || node.left<-1).slice(0,12)})`)
    assert.ok(overflow.scrollWidth<=overflow.width,`card atmospheres do not introduce horizontal overflow: ${JSON.stringify(overflow)}`)
    await pause(650)
    const second = await check()
    assert.notEqual(first.routes[0].d,second.routes[0].d,'paths follow the station animation')
  }
  const cosmic = () => evaluate(`(() => {
    const selectors=['.card-space-orbit-spin','.card-space-nebula-drift','.card-space-vortex-turn','.card-space-stone-one']
    return Array.from(document.querySelectorAll('.agent-cosmic-effects')).map((root,index)=>{
      const scene=root.querySelector(selectors[index]), style=getComputedStyle(scene)
      return {active:root.dataset.cosmicActive,color:getComputedStyle(root).color,animation:style.animationName,transform:style.transform,playState:style.animationPlayState}
    })
  })()`)
  const firstCosmic = await cosmic(); await pause(800); const secondCosmic = await cosmic()
  assert.equal(firstCosmic.length,4,'every selected agent has a cosmic scene')
  assert.equal(new Set(firstCosmic.map(scene=>scene.color)).size,4,'four scenes use four connection colors')
  secondCosmic.forEach((scene,index)=>{
    assert.equal(scene.active,'true'); assert.equal(scene.playState,'running')
    assert.notEqual(scene.animation,'none')
    assert.notEqual(scene.transform,firstCosmic[index].transform,`card ${index+1} visibly moves`)
  })
  await evaluate('document.querySelector(".dashboard-screen").style.paddingBottom="2000px"; scrollTo({top:2400,behavior:"instant"})')
  await pause(250)
  ;(await cosmic()).forEach(scene=>{
    assert.equal(scene.active,'false','offscreen card animation pauses')
    assert.equal(scene.playState,'paused')
  })
  await evaluate('scrollTo({top:0,behavior:"instant"}); document.querySelector(".dashboard-screen").style.paddingBottom=""')
  await pause(250)
  ;(await cosmic()).forEach(scene=>assert.equal(scene.active,'true','card motion resumes when visible'))
  if (webgl && process.env.STARFLOW_STATION_EXPORT) {
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:2,mobile:false})
    for (let attempt=0;attempt<30;attempt++) {
      if (await evaluate('document.querySelector(".station-canvas").width>800')) break
      await pause(100)
    }
    assert.ok(await evaluate('document.querySelector(".station-canvas").width>800'),'fallback export uses a sharp retina-resolution frame')
    // Export the actual current model for devices without WebGL. Draw and read
    // within the same frame because the renderer does not preserve its buffer.
    const frame=await send('Runtime.evaluate',{expression:'new Promise(resolve=>requestAnimationFrame(()=>resolve(document.querySelector(".station-canvas").toDataURL("image/png"))))',awaitPromise:true,returnByValue:true})
    assert.equal(frame.exceptionDetails,undefined)
    await writeFile(process.env.STARFLOW_STATION_EXPORT,Buffer.from(frame.result.value.split(',')[1],'base64'))
    await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1100,deviceScaleFactor:1,mobile:false})
    await pause(200)
  }
  const lettering = () => evaluate(`(() => {
    const word=document.querySelector('.station-core-label strong'), band=document.querySelector('.scheduler-band')
    const text=band.querySelector('.scheduler-wordmark')
    return {transform:getComputedStyle(word).transform,scheduler:getComputedStyle(text).transform,schedulerAnimation:getComputedStyle(text).animationName,light:getComputedStyle(word,'::after').opacity,sweep:getComputedStyle(band,'::before').transform,wordAnimation:getComputedStyle(word).animationName,bandAnimation:getComputedStyle(band,'::before').animationName}
  })()`)
  const first = await lettering(); await pause(800); const second = await lettering()
  assert.notEqual(first.transform,second.transform,'Gemini breathes without layout changes')
  assert.notEqual(first.light,second.light,'Gemini lettering has a changing highlight')
  assert.notEqual(first.sweep,second.sweep,'scheduler lighting moves')
  assert.notEqual(first.scheduler,second.scheduler,'scheduler lettering animates independently from the structure')
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await pause(150); await check()
  const reduced = await lettering()
  assert.equal(reduced.wordAnimation,'none'); assert.equal(reduced.bandAnimation,'none')
  assert.equal(reduced.schedulerAnimation,'none')
  ;(await cosmic()).forEach(scene=>assert.equal(scene.animation,'none','card effects honor reduced motion'))
  if (process.env.STARFLOW_BROWSER_SCREENSHOT) {
    await send('Emulation.setEmulatedMedia',{features:[]})
    await pause(500)
    const screenshot=await send('Page.captureScreenshot',{format:'png'})
    await writeFile(process.env.STARFLOW_BROWSER_SCREENSHOT,Buffer.from(screenshot.data,'base64'))
  }
  const brand = () => evaluate(`(() => {
    const node=document.querySelector('header .brand'), style=getComputedStyle(node), icon=node.querySelector('svg')
    return {text:node.textContent,font:style.fontFamily,size:style.fontSize,weight:style.fontWeight,spacing:style.letterSpacing,gap:style.gap,icon:icon.outerHTML,iconColor:getComputedStyle(icon).color,iconWidth:getComputedStyle(icon).width}
  })()`)
  const dashboardBrand = await brand()
  await send('Page.navigate',{url:server.resolvedUrls.local[0]})
  for (let attempt=0;attempt<50;attempt++) {
    await pause(100)
    if (await evaluate('!!document.querySelector(".navbar .brand")')) break
  }
  assert.deepEqual(await brand(),dashboardBrand,'dashboard uses the same logo and wordmark styling as the landing page')
  assert.deepEqual(exceptions,[],'no uncaught browser errors')
  console.log('Passed: station loading without a legacy-image flash, four connected animated cards, offscreen pausing, responsive labels, reduced motion and consistent branding.')
} finally {
  socket?.close()
  if (browser?.exitCode===null) {
    const stopped = new Promise(resolve => browser.once('exit',resolve))
    browser.kill('SIGTERM')
    await Promise.race([stopped,pause(3000)])
    if (browser.exitCode===null) browser.kill('SIGKILL')
  }
  await server.close()
  await rm(profile,{recursive:true,force:true})
}
