import * as React from 'react'
import { runInAction } from 'mobx'
import EventManager from '../lib/event-manager'
import State from '../lib/state'

/**
* SplitPane hierarchy looks like this:
* ```jsx
* <div class="SplitPane">
*    <div class="Pane vertical Pane1  ">..</div>
*    <span role="presentation" class="Resizer vertical  ">...</span>
* </div>
*```
* we need to set these to display: none during cy.screenshot.
*/
export function useScreenshotHandler ({ eventManager, state, splitPaneRef }: {
  eventManager: typeof EventManager
  state: State
  splitPaneRef: React.MutableRefObject<{ splitPane: HTMLDivElement }>
}) {
  const showPane = () => {
    if (!splitPaneRef.current) {
      return
    }

    splitPaneRef.current.splitPane.firstElementChild.classList.remove('d-none')
    splitPaneRef.current.splitPane.querySelector('[role="presentation"]').classList.remove('d-none')
  }

  const hidePane = () => {
    if (!splitPaneRef.current) {
      return
    }

    splitPaneRef.current.splitPane.firstElementChild.classList.add('d-none')
    splitPaneRef.current.splitPane.querySelector('[role="presentation"]').classList.add('d-none')
  }

  React.useEffect(() => {
    const onBeforeScreenshot = () => {
      runInAction(() => {
        state.setScreenshotting(true)
        hidePane()
      })
    }

    eventManager.on('before:screenshot', onBeforeScreenshot)

    const revertFromScreenshotting = () => {
      runInAction(() => {
        state.setScreenshotting(false)
        showPane()
      })
    }

    eventManager.on('after:screenshot', revertFromScreenshotting)

    eventManager.on('run:start', revertFromScreenshotting)

    return () => {
      eventManager.off('before:screenshot', onBeforeScreenshot)
      eventManager.off('after:screenshot', revertFromScreenshotting)
      eventManager.off('run:start', revertFromScreenshotting)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
