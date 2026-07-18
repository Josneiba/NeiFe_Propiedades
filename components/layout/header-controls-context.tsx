'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type HeaderControlsContextValue = {
  controls: ReactNode | null
  setControls: (controls: ReactNode | null) => void
}

const HeaderControlsContext = createContext<HeaderControlsContextValue>({
  controls: null,
  setControls: () => undefined,
})

export function HeaderControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<ReactNode | null>(null)

  return (
    <HeaderControlsContext.Provider value={{ controls, setControls }}>
      {children}
    </HeaderControlsContext.Provider>
  )
}

export function useHeaderControls() {
  return useContext(HeaderControlsContext)
}

export function usePageHeaderControls(controls: ReactNode | null, deps: unknown[] = []) {
  const { setControls } = useHeaderControls()

  useEffect(() => {
    setControls(controls)

    return () => {
      setControls(null)
    }
  }, [controls, setControls, ...deps])
}
