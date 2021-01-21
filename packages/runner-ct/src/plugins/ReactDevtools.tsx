import React from 'react'
import ReactDomExperimental from 'react-dom'
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend'
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import { UIPlugin } from './UIPlugin'

export function create (root: HTMLElement): UIPlugin {
  let DevTools = () => null
  let isMounted = false
  let _contentWindow = null

  // @ts-expect-error yes it is required to render it with concurrent mode
  const devtoolsRoot = ReactDomExperimental.unstable_createRoot(root)

  function mount () {
    DevTools = initializeFrontend(_contentWindow)
    activateBackend(_contentWindow)

    isMounted = true
    devtoolsRoot.render(<DevTools browserTheme="dark" />)
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
