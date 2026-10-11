import test from 'node:test'
import assert from 'node:assert/strict'
import { connectionColors, connectorPath, portCenter, stationDrift } from '../src/mission/connectionGeometry.ts'

test('every connection has a distinct color', () => {
  assert.equal(connectionColors.length,4)
  assert.equal(new Set(connectionColors).size,4)
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
      assert.ok(path.startsWith(`M${source.x} ${source.y} C`))
      assert.ok(path.endsWith(` ${destination.x} ${destination.y}`))
      const points = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
      assert.equal(points[3],source.y,'source tangent stays horizontal')
      assert.equal(points[5],destination.y,'destination tangent stays horizontal')
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
        assert.ok(path.startsWith(`M${start.x} ${start.y} C`))
        assert.ok(path.endsWith(` ${end.x} ${end.y}`))
      }
    }
  }
  const returned = stationDrift(10500)
  assert.ok(Math.abs(returned.x)<1e-9 && Math.abs(returned.y)<1e-9, 'the loop closes without snapping')
})
