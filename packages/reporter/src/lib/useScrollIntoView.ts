import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from './app-state'
import scroller from './scroller'

interface UseScrollIntoViewOptions {
  appState: AppState
  testState?: string
  isStudioActive?: boolean
}

export const useScrollIntoView = ({ appState, testState, isStudioActive = false }: UseScrollIntoViewOptions) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  const _scrollIntoView = useCallback(() => {
    if (appState.autoScrollingEnabled && (appState.isRunning || isStudioActive) && testState !== 'processing') {
      window.requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (containerRef.current) {
          scroller.scrollIntoView(containerRef.current as HTMLElement)
        }
      })
    }
  }, [appState.autoScrollingEnabled, appState.isRunning, isStudioActive, testState])

  useEffect(() => {
    _scrollIntoView()
    if (!isMounted) {
      setIsMounted(true)
    }
  }, [_scrollIntoView])

  return {
    containerRef,
    isMounted,
    scrollIntoView: _scrollIntoView,
  }
}
