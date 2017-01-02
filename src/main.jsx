import { useStrict, toJS } from 'mobx'
import React from 'react'
import momentOverrides from './lib/overrides/moment-overrides'
import { render } from 'react-dom'
import _ from 'lodash'

import makeRoutes from './routes'

import state from './lib/state'

import Updates from './update/updates'

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'

const handleErrors = () => {
  const sendErr = (err) => {
    if (err) {
      App.ipc('gui:error', _.pick(err, 'name', 'message', 'stack'))
    }

    if (window.env === 'development' || window.env === 'test') {
      console.error(err) // eslint-disable-line no-console
      debugger // eslint-disable-line no-debugger
    }
  }

  window.onerror = (message, source, lineno, colno, err) => {
    sendErr(err)
  }

  window.onunhandledrejection = (err) => {
    const reason = err && err.reason
    sendErr(reason || err)
  }
}

momentOverrides()

const setupState = (options) => {
  state.setVersion(options.version)
  state.listenForMenuClicks()
}

const setupDevVars = () => {
  if (window.env === 'test' || window.env === 'development') {
    window.toJS = toJS
  }
}

App.start = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()
    setupState(options)

    setupDevVars()

    const el = document.getElementById('app')

    render(makeRoutes(options.updating), el)
  })
}

App.startUpdateApp = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()

    setupDevVars()

    const el = document.getElementById('updates')

    render(<Updates options={options}/>, el)
  })
}
