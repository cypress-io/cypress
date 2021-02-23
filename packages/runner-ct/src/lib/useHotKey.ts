import * as React from 'react'
import hotkeys from 'hotkeys-js'

export function useGlobalHotKey (shortcut: string, handler: () => void) {
  React.useEffect(() => {
    hotkeys(shortcut, handler)

    return () => hotkeys.unbind(shortcut)
  }, [shortcut])
}
