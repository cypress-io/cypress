import { configure, toJS } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import ipc from './lib/ipc'
import handleGlobalErrors from './lib/handle-global-errors'
import momentOverrides from './lib/configure-moment'

import App from './app/app'

configure({
  enforceActions: 'observed',
})

handleGlobalErrors()
momentOverrides()

if (window.env === 'test' || window.env === 'development') {
  window.toJS = toJS
}

window.App = {
  ipc, // for stubbing in tests

  start () {
    render(<App />, document.getElementById('app'))
  },
}
