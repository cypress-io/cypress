import * as React from 'react'
import hotkeys from 'hotkeys-js'

export function useGlobalHotKey (shortcut: string, handler: () => void) {
  React.useEffect(() => {
    hotkeys(shortcut, handler)

    return () => hotkeys.unbind(shortcut)
    // TODO: This is incorrect, as the handler function can change and will not cause the useEffect
    // to rerun, therefore preventing it from being updated in the listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut])
}
