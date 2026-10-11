import {
  ACESFilmicToneMapping, AdditiveBlending, BoxGeometry, CanvasTexture, Color,
  CylinderGeometry, DirectionalLight, Group, HemisphereLight, InstancedMesh,
  LatheGeometry, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, Object3D, OrthographicCamera, PMREMGenerator, PointLight,
  RepeatWrapping, Scene, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial,
  SRGBColorSpace, Texture, TextureLoader, TorusGeometry, Vector2, WebGLRenderer,
  type BufferGeometry,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { connectionColors, stationGeometry } from './connectionGeometry'

export type StationScene = { setStatus: (live: boolean, activeCount: number) => void; dispose: () => void }
type Callbacks = { onReady: () => void; onFailure: () => void }

// Coordinates match the original transparent station plate and its HTML labels.
const WORLD_WIDTH = stationGeometry.width, WORLD_HEIGHT = stationGeometry.height

function coreSurface() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048; canvas.height = 1024
  const context = canvas.getContext('2d')!
  const base = context.createLinearGradient(0,0,0,1024)
  base.addColorStop(0,'#143b60'); base.addColorStop(.45,'#06182f'); base.addColorStop(1,'#103758')
  context.fillStyle = base; context.fillRect(0,0,2048,1024)
  context.lineWidth = 1.4; context.strokeStyle = '#6fadc33b'
  for (let x=0; x<=2048; x+=128) { context.beginPath(); context.moveTo(x,0); context.lineTo(x,1024); context.stroke() }
  for (let y=0; y<=1024; y+=128) { context.beginPath(); context.moveTo(0,y); context.lineTo(2048,y); context.stroke() }
  context.fillStyle = '#82d9ed80'
  // Fixed engraving rather than random flicker: these marks turn with the sphere.
  for (let index=0; index<32; index++) {
    const x = (index*317+80)%2048, y = (index*173+96)%1024
    context.fillRect(x,y,14,2); context.fillRect(x,y+5,4,2)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function haloTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')!
  const halo = context.createRadialGradient(32,32,0,32,32,32)
  halo.addColorStop(0,'#ffffffb3'); halo.addColorStop(.18,'#ffffff50'); halo.addColorStop(.5,'#ffffff13'); halo.addColorStop(1,'#ffffff00')
  context.fillStyle = halo; context.fillRect(0,0,64,64)
  return new CanvasTexture(canvas)
}

export function createStationScene(canvas: HTMLCanvasElement, callbacks: Callbacks): StationScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setClearColor(0x000000,0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  let shaderFailed = false
  renderer.debug.onShaderError = () => { shaderFailed = true }
  const scene = new Scene()
  const camera = new OrthographicCamera(-WORLD_WIDTH/2,WORLD_WIDTH/2,WORLD_HEIGHT/2,-WORLD_HEIGHT/2,.1,60)
  camera.position.z = 20
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>()
  const geometry = <T extends BufferGeometry>(value: T): T => { geometries.add(value); return value }
  const material = <T extends Material>(value: T): T => { materials.add(value); return value }
  const metal = material(new MeshStandardMaterial({ color:'#8999aa', metalness:.86, roughness:.36, envMapIntensity:.95 }))
  const edge = material(new MeshStandardMaterial({ color:'#adc3d2', metalness:.94, roughness:.23 }))
  const dark = material(new MeshStandardMaterial({ color:'#142535', metalness:.75, roughness:.42 }))
  const cyan = material(new MeshBasicMaterial({ color:'#59cef2', toneMapped:false }))
  const violet = material(new MeshBasicMaterial({ color:'#a895ed', toneMapped:false }))
  const mesh = (shape: BufferGeometry, surface: Material, parent: Object3D) => {
    const object = new Mesh(shape,surface); parent.add(object); return object
  }

  const createEnvironment = () => {
    const room = new RoomEnvironment()
    const pmrem = new PMREMGenerator(renderer)
    const environment = pmrem.fromScene(room,.035)
    room.dispose(); pmrem.dispose()
    return environment
  }
  let environment = createEnvironment()
  scene.environment = environment.texture
  scene.environmentIntensity = .7
  scene.add(new HemisphereLight('#c0dbea','#081323',1.2))
  const softbox = new DirectionalLight('#e3eef5',2.5)
  softbox.position.set(-5,7,9); scene.add(softbox)
  const blueLight = new PointLight('#4dcdff',85,18,2)
  blueLight.position.set(-4,2.8,5); scene.add(blueLight)
  const purpleLight = new PointLight('#ab98f7',75,18,2)
  purpleLight.position.set(4,1.4,4); scene.add(purpleLight)
  const lowerLight = new PointLight('#229eea',65,14,2)
  lowerLight.position.set(-.5,-4,3); scene.add(lowerLight)

  // A machined, bevelled annulus has actual thickness, unlike a flat circular sprite.
  const ringProfile = [
    [4.72,-.13],[4.76,-.24],[5.12,-.24],[5.22,-.14],
    [5.22,.14],[5.12,.24],[4.76,.24],[4.72,.13],[4.72,-.13],
  ].map(([radius,depth]) => new Vector2(radius,depth))
  const annulus = geometry(new LatheGeometry(ringProfile,192))
  // Cover the face with the full panel strip, rather than a thin slice of the atlas.
  const uv = annulus.getAttribute('uv')
  for (let index=0; index<uv.count; index++) uv.setY(index,(ringProfile[index%ringProfile.length].x-4.72)/.5)
  annulus.rotateX(Math.PI/2)
  const outer = new Group(); outer.position.y = stationGeometry.ringY; scene.add(outer)
  mesh(annulus,metal,outer)
  const outerTrack = mesh(geometry(new TorusGeometry(5.19,.025,8,192)),edge,outer)
  outerTrack.position.z = .2
  const innerTrack = mesh(geometry(new TorusGeometry(4.75,.026,8,192)),edge,outer)
  innerTrack.position.z = .2

  // Reuse geometry and instance fasteners / housings, keeping draw calls bounded.
  const bolts = new InstancedMesh(geometry(new CylinderGeometry(.028,.034,.035,6)),edge,96)
  const transform = new Object3D()
  for (let index=0; index<96; index++) {
    const angle = (index%48)/48*Math.PI*2, radius = index<48 ? 4.82 : 5.1
    transform.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,.254)
    transform.rotation.set(Math.PI/2,0,angle); transform.updateMatrix(); bolts.setMatrixAt(index,transform.matrix)
  }
  outer.add(bolts)
  const housings = new InstancedMesh(geometry(new BoxGeometry(.14,.54,.12)),dark,24)
  const lamps = new InstancedMesh(geometry(new BoxGeometry(.035,.3,.025)),cyan,24)
  for (let index=0; index<24; index++) {
    const angle = index/24*Math.PI*2
    transform.position.set(Math.cos(angle)*4.97,Math.sin(angle)*4.97,.28)
    transform.rotation.set(0,0,angle); transform.updateMatrix(); housings.setMatrixAt(index,transform.matrix)
    transform.position.z = .355; transform.updateMatrix(); lamps.setMatrixAt(index,transform.matrix)
  }
  outer.add(housings,lamps)

  const counter = new Group(); counter.position.set(0,-.24,-.15); scene.add(counter)
  mesh(geometry(new TorusGeometry(4.36,.055,8,160)),dark,counter)
  mesh(geometry(new TorusGeometry(4.35,.012,6,160)),violet,counter)
  const calibration = new InstancedMesh(geometry(new BoxGeometry(.025,.14,.06)),edge,72)
  for (let index=0; index<72; index++) {
    const angle = index/72*Math.PI*2
    transform.position.set(Math.cos(angle)*4.35,Math.sin(angle)*4.35,.065)
    transform.rotation.set(0,0,angle-Math.PI/2); transform.updateMatrix(); calibration.setMatrixAt(index,transform.matrix)
  }
  counter.add(calibration)
  for (let index=0; index<4; index++) {
    const segment = mesh(geometry(new TorusGeometry(4.26,.024,6,48,.32)),index%2 ? violet : cyan,counter)
    segment.rotation.z = index*Math.PI/2; segment.position.z = .08
  }

  const surface = coreSurface(); textures.add(surface)
  const coreMaterial = material(new MeshPhysicalMaterial({
    map:surface, color:'#8dc5ed', metalness:.3, roughness:.19,
    clearcoat:1, clearcoatRoughness:.055, envMapIntensity:1.45,
  }))
  const core = mesh(geometry(new SphereGeometry(2.86,80,48)),coreMaterial,scene)
  core.position.y = -.04
  core.rotation.z = -.09
  const atmosphere = material(new ShaderMaterial({
    transparent:true, depthWrite:false, blending:AdditiveBlending,
    uniforms:{ intensity:{ value:.4 } },
    vertexShader:`varying vec3 normalView; varying vec3 positionView;
      void main(){normalView=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);positionView=p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float intensity; varying vec3 normalView; varying vec3 positionView;
      void main(){float rim=pow(1.-max(0.,dot(normalize(normalView),normalize(-positionView))),3.);
      gl_FragColor=vec4(mix(vec3(.08,.47,.85),vec3(.39,.78,1.),rim),rim*intensity);}`,
  }))
  const rim = mesh(geometry(new SphereGeometry(2.91,64,40)),atmosphere,scene)
  rim.position.copy(core.position)

  // The equatorial mechanism revolves behind a fixed curved nameplate.
  const equator = new Group(); equator.position.y = .05; equator.rotation.x = .12; scene.add(equator)
  const equatorRotor = new Group(); equator.add(equatorRotor)
  const beltProfile = [[5.04,-.34],[5.17,-.46],[5.38,-.46],[5.5,-.33],[5.5,.33],[5.38,.46],[5.17,.46],[5.04,.34],[5.04,-.34]].map(([radius,depth]) => new Vector2(radius,depth))
  const beltGeometry = geometry(new LatheGeometry(beltProfile,192))
  const beltUV = beltGeometry.getAttribute('uv')
  for (let index=0; index<beltUV.count; index++) beltUV.setY(index,(beltProfile[index%beltProfile.length].y+.46)/.92)
  mesh(beltGeometry,metal,equatorRotor)
  for (const y of [-.43,.43]) {
    const trim = mesh(geometry(new TorusGeometry(5.37,.038,8,160)),edge,equatorRotor)
    trim.rotation.x = Math.PI/2; trim.position.y = y
    const strip = mesh(geometry(new TorusGeometry(5.38,.014,6,160)),cyan,equatorRotor)
    strip.rotation.x = Math.PI/2; strip.position.y = y*.88
  }
  const beltClamps = new InstancedMesh(geometry(new BoxGeometry(.11,.91,.17)),dark,32)
  const beltIndicators = new InstancedMesh(geometry(new BoxGeometry(.04,.32,.025)),cyan,32)
  for (let index=0; index<32; index++) {
    const angle = index/32*Math.PI*2
    transform.position.set(Math.sin(angle)*5.51,0,Math.cos(angle)*5.51)
    transform.rotation.set(0,angle,0); transform.updateMatrix(); beltClamps.setMatrixAt(index,transform.matrix)
    transform.position.set(Math.sin(angle)*5.61,0,Math.cos(angle)*5.61)
    transform.updateMatrix(); beltIndicators.setMatrixAt(index,transform.matrix)
  }
  equatorRotor.add(beltClamps,beltIndicators)
  mesh(geometry(new CylinderGeometry(5.64,5.64,.76,64,1,true,-.62,1.24)),dark,equator)
  for (const x of [-2.92,2.92]) {
    const lamp = mesh(geometry(new BoxGeometry(.025,.38,.025)),cyan,equator)
    lamp.position.set(x,0,Math.sqrt(5.66**2-x*x)); lamp.rotation.y = Math.asin(x/5.66)
  }

  // Both masts are real hardware: rotating collars, engraved stems and tapered sensor spires.
  const mastProfile = [[.48,0],[.65,.13],[.65,.23],[.48,.3],[.24,.38],[.24,.91],[.37,.96],[.37,1.12],[.2,1.2],[.16,2.1],[.27,2.17],[.27,2.3],[.1,2.38],[.065,3.35],[.025,3.62],[0,3.75]].map(([radius,height]) => new Vector2(radius,height))
  const mastGeometry = geometry(new LatheGeometry(mastProfile,80))
  const mastUV = mastGeometry.getAttribute('uv')
  for (let index=0; index<mastUV.count; index++) mastUV.setY(index,mastProfile[index%mastProfile.length].y/3.75)
  const needleGeometry = geometry(new CylinderGeometry(.006,.026,1.75,8))
  const masts = [1,-1].map(direction => {
    const mounting = new Group(); mounting.position.y = direction*2.72
    if (direction<0) mounting.rotation.z = Math.PI
    scene.add(mounting)
    const rotor = new Group(); mounting.add(rotor)
    mesh(mastGeometry,metal,rotor)
    for (const [height,radius] of [[.18,.656],[.98,.378],[1.1,.378],[2.22,.277]]) {
      const ring = mesh(geometry(new TorusGeometry(radius,.012,6,64)),cyan,rotor)
      ring.rotation.x = Math.PI/2; ring.position.y = height
    }
    for (let index=0; index<4; index++) {
      const angle = index/4*Math.PI*2
      const needle = mesh(needleGeometry,edge,rotor)
      needle.position.set(Math.cos(angle)*.155,2.43+index*.05,Math.sin(angle)*.155)
    }
    const collar = new Group(); mounting.add(collar)
    for (let index=0; index<8; index++) {
      const angle = index/8*Math.PI*2
      const rib = mesh(geometry(new BoxGeometry(.06,.26,.09)),edge,collar)
      rib.position.set(Math.sin(angle)*.67,.18,Math.cos(angle)*.67); rib.rotation.y = angle
    }
    for (const [angle,surface] of [[.3,cyan],[2.6,violet]] as const) {
      const beacon = mesh(geometry(new BoxGeometry(.08,.055,.04)),surface,collar)
      beacon.position.set(Math.sin(angle)*.715,.18,Math.cos(angle)*.715); beacon.rotation.y = angle
    }
    return { rotor, collar }
  })

  const halos = haloTexture(); textures.add(halos)
  const orbiters = [0,1].map(index => {
    const orbit = new Group(); orbit.position.y = -.04
    orbit.rotation.set(index ? 1.13 : .82,index ? -.42 : .36,index ? -.2 : .24)
    scene.add(orbit)
    const trackMaterial = material(new MeshStandardMaterial({ color:index ? '#7776a6' : '#3a819e', metalness:.65, roughness:.35, transparent:true, opacity:.5 }))
    mesh(geometry(new TorusGeometry(3.27+index*.12,.012,6,144)),trackMaterial,orbit)
    const carrier = new Group(); orbit.add(carrier)
    const satellite = mesh(geometry(new SphereGeometry(.058,12,8)),index ? violet : cyan,carrier)
    satellite.position.x = 3.27+index*.12
    const halo = new Sprite(material(new SpriteMaterial({ map:halos, color:index ? '#c2a8ff' : '#76eaff', transparent:true, blending:AdditiveBlending, depthWrite:false, opacity:.5 })))
    halo.position.copy(satellite.position); halo.scale.setScalar(.42); carrier.add(halo)
    return carrier
  })

  const dockCollar = geometry(new TorusGeometry(.13,.04,8,24))
  const dockInsert = geometry(new CylinderGeometry(.088,.088,.18,20))
  const dockStrut = geometry(new CylinderGeometry(.07,.085,1,8))
  const docks = connectionColors.map(color => {
    const group = new Group(); scene.add(group)
    const housing = mesh(dockCollar,edge,group)
    housing.position.z = 1.35
    const insert = mesh(dockInsert,material(new MeshStandardMaterial({ color:'#253b50', metalness:.72, roughness:.24, emissive:new Color(color), emissiveIntensity:.12 })),group)
    insert.rotation.x = Math.PI/2; insert.position.z = 1.35
    const strut = mesh(dockStrut,dark,group)
    return { group, strut, housing, insert }
  })

  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const compact = matchMedia('(max-width:760px)')
  let frame = 0, lastTime = 0, lastDraw = 0, elapsed = 0
  let ready = false, visible = false, disposed = false, contextLost = false, live = false, activeCount = 3
  const positionDocks = () => {
    const origin = canvas.getBoundingClientRect()
    if (!origin.width || !origin.height) return
    docks.forEach(({group,strut,housing,insert},index) => {
      const port = canvas.parentElement?.querySelector<HTMLElement>(`[data-station-port="${index}"]`)
      group.visible = index < activeCount && !!port
      if (!port) return
      const bounds = port.getBoundingClientRect()
      group.position.x = ((bounds.left+bounds.width/2-origin.left)/origin.width-.5)*WORLD_WIDTH
      group.position.y = (.5-(bounds.top+bounds.height/2-origin.top)/origin.height)*WORLD_HEIGHT
      // Keep the coupling wider than the 16px tube even on a small station canvas.
      const fittingScale = (bounds.width+10)/origin.width*WORLD_WIDTH/.34
      housing.scale.setScalar(fittingScale)
      insert.scale.setScalar(fittingScale)
      const dx = group.position.x, dy = group.position.y-core.position.y
      const radius = Math.hypot(dx,dy)
      const reach = Math.max(.12,radius-2.68)
      strut.scale.y = reach
      strut.position.set(-dx/radius*reach/2,-dy/radius*reach/2,1.27)
      strut.rotation.z = -Math.atan2(dx,dy)
    })
  }
  const draw = () => {
    outer.rotation.set(Math.sin(elapsed*.23)*.045,.13+Math.sin(elapsed*.19)*.045,elapsed*.105)
    counter.rotation.set(-.035,-.16,-elapsed*.17)
    core.rotation.y = elapsed*.14
    equator.rotation.x = .12+Math.sin(elapsed*.43)*.012
    equator.position.y = .05+Math.sin(elapsed*.31)*.025
    equatorRotor.rotation.y = elapsed*.16
    masts.forEach(({rotor,collar},index) => {
      rotor.rotation.y = elapsed*(index ? -.27 : .23)
      rotor.position.y = Math.sin(elapsed*.6+index*Math.PI)*.035
      collar.rotation.y = elapsed*(index ? .18 : -.2)
    })
    orbiters.forEach((orbiter,index) => { orbiter.rotation.z = elapsed*(index ? -.32 : .27)+index*Math.PI })
    blueLight.position.x = -4+Math.sin(elapsed*.3)*.7
    purpleLight.position.y = 1.4+Math.cos(elapsed*.26)*.55
    atmosphere.uniforms.intensity.value = (live ? .42 : .28)+Math.sin(elapsed*.8)*.025
    renderer.render(scene,camera)
    if (shaderFailed && !disposed) { dispose(); callbacks.onFailure() }
  }
  const tick = (time: number) => {
    frame = requestAnimationFrame(tick)
    if (lastTime) elapsed += Math.min((time-lastTime)/1000,.05)
    lastTime = time
    if (time-lastDraw < 1000/(compact.matches ? 30 : 60)-.6) return
    const interval = 1000/(compact.matches ? 30 : 60)
    lastDraw = time - ((time-lastDraw) % interval); draw()
  }
  const update = () => {
    cancelAnimationFrame(frame); lastTime = 0; lastDraw = 0
    if (!ready || disposed || contextLost) return
    draw()
    // Mechanical motion is decorative; released packets still come only from live backend counters.
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick)
  }
  const resize = () => {
    if (disposed || contextLost) return
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (!width || !height) return
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact.matches ? 1.35 : 1.65,1100/width))
    renderer.setSize(width,height,false)
    positionDocks(); update()
  }
  const loseContext = (event: Event) => {
    event.preventDefault(); contextLost = true; cancelAnimationFrame(frame); callbacks.onFailure()
  }
  const restoreContext = () => {
    contextLost = false
    if (disposed || !ready) return
    try {
      shaderFailed = false
      environment.dispose(); environment = createEnvironment(); scene.environment = environment.texture
      resize()
      if (!disposed) callbacks.onReady()
    } catch { dispose(); callbacks.onFailure() }
  }
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
  const sizing = new ResizeObserver(resize)
  const dispose = () => {
    if (disposed) return
    disposed = true; cancelAnimationFrame(frame)
    intersection.disconnect(); sizing.disconnect()
    motion.removeEventListener('change',update); compact.removeEventListener('change',resize)
    document.removeEventListener('visibilitychange',update)
    canvas.removeEventListener('webglcontextlost',loseContext); canvas.removeEventListener('webglcontextrestored',restoreContext)
    geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); textures.forEach(item => item.dispose())
    environment.dispose(); renderer.dispose(); renderer.forceContextLoss()
  }
  intersection.observe(canvas); sizing.observe(canvas)
  motion.addEventListener('change',update); compact.addEventListener('change',resize)
  document.addEventListener('visibilitychange',update)
  canvas.addEventListener('webglcontextlost',loseContext); canvas.addEventListener('webglcontextrestored',restoreContext)
  resize()
  void new TextureLoader().loadAsync('/images/station-metal-v2.jpg').then(async texture => {
    if (disposed) { texture.dispose(); return }
    textures.add(texture)
    texture.colorSpace = SRGBColorSpace; texture.wrapS = RepeatWrapping; texture.repeat.x = 2
    texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy())
    metal.map = texture; metal.bumpMap = texture; metal.bumpScale = .018; metal.needsUpdate = true
    await renderer.compileAsync(scene,camera)
    if (disposed) return
    ready = true
    if (!contextLost) { resize(); if (!disposed) callbacks.onReady() }
  }).catch(() => { if (!disposed) { dispose(); callbacks.onFailure() } })
  return {
    setStatus(nextLive,count) {
      if (disposed) return
      live = nextLive; activeCount = Math.min(4,Math.max(0,count))
      cyan.color.set(live ? '#59cef2' : '#438caa')
      violet.color.set(live ? '#a895ed' : '#716592')
      positionDocks(); update()
    },
    dispose,
  }
}
