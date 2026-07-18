'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type HeaderState = {
  title: ReactNode | null
  subtitle: string | null
  controls: ReactNode | null
}

type HeaderControlsContextValue = HeaderState & {
  setHeader: (next: Partial<HeaderState>) => void
  resetHeader: () => void
}

const HeaderControlsContext = createContext<HeaderControlsContextValue>({
  title: null,
  subtitle: null,
  controls: null,
  setHeader: () => undefined,
  resetHeader: () => undefined,
})

export function HeaderControlsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HeaderState>({ title: null, subtitle: null, controls: null })

  const setHeader = useCallback((next: Partial<HeaderState>) => {
    setState((s) => ({ ...s, ...next }))
  }, [])

  const resetHeader = useCallback(() => {
    setState({ title: null, subtitle: null, controls: null })
  }, [])

  const value = useMemo(
    () => ({ ...state, setHeader, resetHeader }),
    [resetHeader, setHeader, state],
  )

  return (
    <HeaderControlsContext.Provider value={value}>
      {children}
    </HeaderControlsContext.Provider>
  )
}

export function useHeaderControls() {
  return useContext(HeaderControlsContext)
}

export function usePageHeader(next: { title?: ReactNode | null; subtitle?: string | null; controls?: ReactNode | null }, deps: unknown[] = []) {
  const { setHeader, resetHeader } = useHeaderControls()

  useEffect(() => {
    setHeader(next)
    return () => resetHeader()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeader, resetHeader, ...deps])
}
