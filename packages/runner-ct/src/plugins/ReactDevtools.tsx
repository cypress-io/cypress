import React from 'react'
import ReactDomExperimental from 'react-dom'
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend'
import { ReactDevtoolsFallback } from './ReactDevtoolsFallback'
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import { UIPlugin } from './UIPlugin'

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)')

export function create (root: HTMLElement): UIPlugin {
  let DevTools = () => null
  let isMounted = false
  let isFirstMount = true
  let _contentWindow = null

  // @ts-expect-error yes it is required to render it with concurrent mode
  const devtoolsRoot = ReactDomExperimental.unstable_createRoot(root)

  function mount () {
    if (!document.querySelector('.aut-iframe')) {
      devtoolsRoot.render(<ReactDevtoolsFallback />)

      return
    }

    if (!isFirstMount) {
      // if devtools were unmounted it is closing the bridge, so we need to reinitialize the bridge on our side
      DevTools = initializeFrontend(_contentWindow)
      activateBackend(_contentWindow)
    }

    devtoolsRoot.render(<DevTools browserTheme={prefersDarkScheme ? 'dark' : 'light'} />)
    isMounted = true
    isFirstMount = false
  }

  function unmount () {
    isMounted = false
    devtoolsRoot.unmount()
  }

  function initialize (contentWindow: Window) {
    _contentWindow = contentWindow
    // @ts-expect-error global hook for react devtools is not typed
    window.__REACT_DEVTOOLS_TARGET_WINDOW__ = contentWindow
    initializeBackend(contentWindow)

    // if devtools is rendered for previous spec we need to rerender them for new component
    if (isMounted) {
      mount()
    } else {
      isFirstMount = true
      // when we are initialized the devtools we can preconnect the devtools to the bridge
      // so the devtools will instantly open instead of loading for connection
      DevTools = initializeFrontend(_contentWindow)
      activateBackend(_contentWindow)
    }
  }

  return {
    name: 'React devtools',
    type: 'devtools',
    mount,
    unmount,
    initialize,
  }
}
