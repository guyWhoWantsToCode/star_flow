export type Point = { x: number; y: number }
export const connectionColors = ['#2bddf3', '#bd83ff', '#339cff', '#ffbd72'] as const

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
  const bend = Math.max(28, Math.abs(end.x - start.x) * .52)
  const direction = end.x < start.x ? -1 : 1
  return `M${start.x} ${start.y} C${start.x + bend * direction} ${start.y} ${end.x - bend * direction} ${end.y} ${end.x} ${end.y}`
}
export function portCenter(rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, origin: Pick<DOMRect, 'left' | 'top'>): Point {
  return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top }
}
