import test from 'node:test'
import assert from 'node:assert/strict'
import { OrthographicCamera, Vector3 } from 'three'
import { connectionColors, connectorPath, portCenter, stationDockAnchor, stationDrift, stationGeometry } from '../src/mission/connectionGeometry.ts'

test('every connection has a distinct color', () => {
  assert.equal(connectionColors.length,4)
  assert.equal(new Set(connectionColors).size,4)
})
test('all four SVG endpoints coincide with physical rim fittings at every screen size', () => {
  const { width, height, ringY, dockingRadius } = stationGeometry
  const camera = new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,60)
  camera.position.z = 20
  camera.updateMatrixWorld()
  for (const canvasWidth of [280,330,420,600]) {
    const canvasHeight = canvasWidth*height/width
    for (const compact of [false,true]) {
      const anchors = Array.from({length:4},(_,slot) => stationDockAnchor(slot,compact))
      assert.equal(new Set(anchors.map(point => `${point.x},${point.y}`)).size,4,'each service has its own fitting')
      anchors.forEach((anchor,slot) => {
        const fitting = new Vector3((anchor.x-.5)*width,(.5-anchor.y)*height,1.35)
        assert.ok(Math.abs(Math.hypot(fitting.x,fitting.y-ringY)-dockingRadius)<1e-9,'fitting touches the outer rim rather than floating inside it')
        const projected = fitting.project(camera)
        for (const time of [0,2625,5250,7875]) {
          const drift = stationDrift(time)
          const rendered = {x:(projected.x+1)/2*canvasWidth+drift.x,y:(1-projected.y)/2*canvasHeight+drift.y}
          const destination = {x:anchor.x*canvasWidth+drift.x,y:anchor.y*canvasHeight+drift.y}
          assert.ok(Math.hypot(rendered.x-destination.x,rendered.y-destination.y)<1e-9,'SVG endpoint stays centered on its 3D fitting while drifting')
          const path = connectorPath({x:slot%2 ? canvasWidth+120 : -120,y:slot<2 ? 90 : 400},destination,compact)
          assert.ok(path.endsWith(` ${destination.x} ${destination.y}`))
        }
        if (!compact) assert.equal(anchor.x<.5,slot%2===0,'left and right services dock on their respective sides')
        else assert.ok(anchor.y>.8,'stacked mobile cards connect to the lower arc')
      })
    }
  }
})
test('connections start and finish at measured docking centers after resizing', () => {
  for (const width of [780,1024,1440,1920]) {
    const origin = { left: 31, top: 113 }
    for (let slot=0; slot<4; slot++) {
      const right = slot % 2 === 1
      const lower = slot >= 2
      const source = portCenter({left:origin.left + width*(right ? .75 : .25)-13,top:origin.top+(lower ? 470 : 130),width:26,height:48},origin)
      const destination = portCenter({left:origin.left + width*(right ? .59 : .41),top:origin.top+(lower ? 420 : 260),width:16,height:16},origin)
      const path = connectorPath(source,destination)
      assert.ok(path.startsWith(`M${source.x} ${source.y} L`))
      assert.ok(path.endsWith(` ${destination.x} ${destination.y}`))
      const points = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
      assert.deepEqual(points,[source.x,source.y,destination.x,destination.y],'desktop connectors take the direct route drawn in the reference')
      assert.ok(points.every(Number.isFinite))
    }
  }
})
test('stacked mobile connections meet both ports with vertical tangents', () => {
  const source = {x:160,y:950}, destination = {x:120,y:320}
  const path = connectorPath(source,destination,true)
  const points = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
  assert.deepEqual(points.slice(0,2),[source.x,source.y])
  assert.deepEqual(points.slice(-2),[destination.x,destination.y])
  assert.equal(points[2],source.x)
  assert.equal(points[4],destination.x)
  assert.ok(points[3]<source.y)
  assert.ok(points[5]>destination.y)
})
test('station drift keeps all four sources anchored and docking endpoints attached throughout a loop', () => {
  assert.deepEqual(stationDrift(0),{x:0,y:0})
  for (const time of [0,1000,2625,5250,7875,10500]) {
    const offset = stationDrift(time)
    assert.ok(Math.abs(offset.x) <= 4 && offset.y >= -12 && offset.y <= 0, 'motion remains subtle')
    for (let slot=0; slot<4; slot++) {
      const start = {x:slot%2 ? 1200 : 300,y:slot<2 ? 170 : 520}
      const dock = {x:slot%2 ? 850 : 650,y:slot<2 ? 320 : 460}
      const end = {x:dock.x+offset.x,y:dock.y+offset.y}
      for (const vertical of [false,true]) {
        const path = connectorPath(start,end,vertical)
        assert.ok(path.startsWith(`M${start.x} ${start.y} ${vertical ? 'C' : 'L'}`))
        assert.ok(path.endsWith(` ${end.x} ${end.y}`))
      }
    }
  }
  const returned = stationDrift(10500)
  assert.ok(Math.abs(returned.x)<1e-9 && Math.abs(returned.y)<1e-9, 'the loop closes without snapping')
})
