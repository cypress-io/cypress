import React from 'react'
import ReactDomExperimental from 'react-dom'
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend'
import { ReactDevtoolsFallback } from './ReactDevtoolsFallback'
import { DevtoolsProps, initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import { UIPlugin } from './UIPlugin'

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)')

export function create (): UIPlugin {
  // This doesn't really have sense right now due, but we need to deal with this in future
  // For now react-split-pane view is recreating virtual tree on each render
  // Thats why when `state.spec` changed domElement will be recreated and content will be flushed
  let DevTools: React.ComponentType<DevtoolsProps> = ReactDevtoolsFallback
  let isMounted = false
  let isFirstMount = true
  let _contentWindow: Window | null = null
  let devtoolsRoot: { render: (component: JSX.Element) => void, unmount: () => void } | null = null

  function mount (domElement?: HTMLElement) {
    if (!isFirstMount) {
      // if devtools were unmounted it is closing the bridge, so we need to reinitialize the bridge on our side
      DevTools = initializeFrontend(_contentWindow)
      activateBackend(_contentWindow)
    }

    if (domElement) {
      // @ts-expect-error unstable is not typed
      devtoolsRoot = ReactDomExperimental.unstable_createRoot(domElement)
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
