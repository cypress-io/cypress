import { useStrict, toJS } from 'mobx'
import React from 'react'
import momentOverrides from './lib/overrides/moment-overrides'
import { render } from 'react-dom'
import _ from 'lodash'

import appApi from './lib/app-api'
import makeRoutes from './routes'
import state from './lib/state'
import Updates from './update/updates'

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'

const handleErrors = () => {
  const sendErr = (err) => {
    if (err) {
      ipc.guiError(_.pick(err, 'name', 'message', 'stack'))
    }

    if (window.env === 'development' || window.env === 'test') {
      console.error(err) // eslint-disable-line no-console
      debugger // eslint-disable-line no-debugger
    }
  }

  window.onerror = (message, source, lineno, colno, err) => {
    sendErr(err)
  }

  window.onunhandledrejection = (event) => {
    const reason = event && event.reason
    sendErr(reason || event)
  }
}

momentOverrides()

const setupState = (options) => {
  state.setVersion(options.version)
  appApi.listenForMenuClicks()
}

const setupDevVars = () => {
  if (window.env === 'test' || window.env === 'development') {
    window.toJS = toJS
  }
}

App.start = () => {
  ipc.getOptions()
  .then((options = {}) => {

    handleErrors()
    setupState(options)

    setupDevVars()

    const el = document.getElementById('app')

    render(makeRoutes(options.updating), el)
  })
}

App.startUpdateApp = () => {
  ipc.getOptions()
  .then((options = {}) => {

    handleErrors()

    setupDevVars()

    const el = document.getElementById('updates')

    render(<Updates options={options}/>, el)
  })
}
