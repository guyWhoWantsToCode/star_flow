import { createContext, useContext, type MouseEvent } from 'react'
export const MissionNavigation = createContext<(event: MouseEvent<HTMLAnchorElement>) => void>(() => {})
export const useMissionNavigation = () => useContext(MissionNavigation)
