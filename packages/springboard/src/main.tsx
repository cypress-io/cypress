import { configure as configureMobx } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import { App } from './App'

configureMobx({ enforceActions: 'observed' })

declare global {
  interface Window {
    App: {
      start: () => void
    }
  }
}

window.App = {
  start () {
    render(<App />, document.getElementById('app'))
  },
}
