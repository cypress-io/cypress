// import React from 'react'
// import ReactDomExperimental from 'react-dom'
// import {
//   activate as activateBackend,
//   initialize as initializeBackend,
// } from 'react-devtools-inline/backend'
// import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import 'vue-devtools-inline'
import { UIPlugin } from './UIPlugin'

export function create (root: HTMLElement): UIPlugin {
  const style = document.createElement('style')

  style.innerText = '.message-container { display: none !important; }'
  document.body.appendChild(style)

  function mount () {
    const autIframe = document.getElementsByClassName('aut-iframe')[0]

    // @ts-ignore
    if (autIframe) window.VueDevtoolsInline.inlineDevtools(root, autIframe)
  }

  function unmount () {
  }

  function initialize (contentWindow: Window) {
  }

  return {
    name: 'Vue Devtools',
    type: 'devtools',
    mount,
    unmount,
    initialize,
  }
}
