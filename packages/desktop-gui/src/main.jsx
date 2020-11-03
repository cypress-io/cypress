import './main.scss'
import { configure as configureMobx, toJS } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import ipc from './lib/ipc'
import handleGlobalErrors from './lib/handle-global-errors'

import App from './app/app'

configureMobx({ enforceActions: 'observed' })

handleGlobalErrors()

if (window.env === 'test' || window.env === 'development') {
  window.toJS = toJS
}

window.App = {
  ipc, // for stubbing in tests

  start () {
    render(<App />, document.getElementById('app'))
  },
}
