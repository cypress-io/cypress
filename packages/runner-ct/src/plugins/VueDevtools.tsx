import * as React from 'react'
import ReactDomExperimental from 'react-dom'
import { UIPlugin } from './UIPlugin'
import { observer } from 'mobx-react'
import { observable, action } from 'mobx'
import { nanoid } from 'nanoid'
import { Devtools } from './VueDevtoolsPlugin/Devtools'
import { State, VueEvent } from './VueDevtoolsPlugin/state'

let eventListener: (evt: MessageEvent) => void
let isMounted = false

let state

export function create (root: HTMLElement): UIPlugin {
  const devtoolsRoot = ReactDomExperimental.unstable_createRoot(root)

  function mount () {
    // re-initialize state
    state = new State()
    console.log('mount()')
    devtoolsRoot.render(<Devtools state={state} />)
    isMounted = true
  }

  function beforeTest () {
    console.log('beforeTest')
  }

  function unmount () {
    isMounted = false
    devtoolsRoot.unmount()
  }

  function initialize (contentWindow: Window) {
    // clean up previous listener if it exists to avoid duplicate messages.
    window.top.removeEventListener('message', eventListener)

    function handler (event: MessageEvent) {
      if (!isMounted) {
        return
      }

      if (event.data.type === 'vue:mounted') {
        state.setInstanceId(event.data.instanceId)
        state.clearEvents()
      }

      if (event.data.type === 'vue:event-emit') {
        state.addEvent({ uid: nanoid(), name: event.data.name, payload: event.data.payload })
      }

      if (event.data.type === 'vue:components') {
        console.log(event.data)
        state.setComponents(event.data.components)
      }


    }
    eventListener = handler

    window.top.addEventListener('message', handler)
  }

  return {
    name: 'Vue Devtools',
    type: 'devtools',
    mount,
    unmount,
    beforeTest,
    initialize,
  }
}
