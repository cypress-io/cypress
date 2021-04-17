import * as React from 'react'
import hotkeys from 'hotkeys-js'

export const useGlobalHotKey = (shortcut: string, handler: () => void) => {
  React.useEffect(() => {
    // Provide a clean handler since we assert that `handler` has no args
    hotkeys(shortcut, () => handler())

    return () => hotkeys.unbind(shortcut)
  }, [shortcut, handler])
}
