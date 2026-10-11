export type Point = { x: number; y: number }
export const connectionColors = ['#2bddf3', '#bd83ff', '#339cff', '#ffbd72'] as const

// Shared by the SVG docking anchors and the orthographic 3D camera.
export const stationGeometry = { width: 11.59, height: 13.57, ringY: -.24, dockingRadius: 4.97 } as const
export function stationDockAnchor(slot: number, compact = false): Point {
  const angles = compact ? [249,263,277,291] : [167,13,199,341]
  const angle = angles[slot] * Math.PI / 180
  const x = Math.cos(angle) * stationGeometry.dockingRadius
  const y = Math.sin(angle) * stationGeometry.dockingRadius + stationGeometry.ringY
  return { x: x / stationGeometry.width + .5, y: .5 - y / stationGeometry.height }
}

// A small closed orbit starts at the original position, avoiding a jump on load.
export function stationDrift(elapsedMs: number): Point {
  const phase = elapsedMs / 10500 * Math.PI * 2
  return { x: Math.sin(phase) * 4, y: (Math.cos(phase) - 1) * 6 }
}

// Endpoints come from the actual docking ports, so fonts and screen size cannot open gaps.
export function connectorPath(start: Point, end: Point, vertical = false) {
  if (vertical) {
    const bend = Math.max(24, Math.abs(end.y - start.y) * .46)
    const direction = end.y < start.y ? -1 : 1
    return `M${start.x} ${start.y} C${start.x} ${start.y + bend * direction} ${end.x} ${end.y - bend * direction} ${end.x} ${end.y}`
  }
  // Direct diagonal runs match the four card-to-rim routes in the reference.
  return `M${start.x} ${start.y} L ${end.x} ${end.y}`
}
export function portCenter(rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, origin: Pick<DOMRect, 'left' | 'top'>): Point {
  return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top }
}
