let sceneModule: Promise<typeof import('./stationScene')> | undefined

export function loadStationScene() {
  return sceneModule ??= import('./stationScene').catch(error => {
    sceneModule = undefined
    throw error
  })
}

export function preloadStation() {
  void loadStationScene().catch(() => {})
  for (const href of ['/images/station-metal-v2.jpg', '/images/mission-station-current.png']) {
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = href
    document.head.append(link)
  }
}
