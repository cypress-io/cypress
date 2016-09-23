import { useStrict } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import _ from 'lodash'

import makeRoutes from './routes'

import state from './lib/state'

import Updates from './update/updates'

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'

const handleErrors = () => {
  const sendErr = function (err) {
    if (err) {
      return App.ipc('gui:error', _.pick(err, 'name', 'message', 'stack'))
    }
  }

  window.onerror = function (message, source, lineno, colno, err) {
    return sendErr(err)
  }

  window.onunhandledrejection = function (evt) {
    return sendErr(evt.reason)
  }
}

const setupState = (options) => {
  state.setVersion(options.version)
  state.listenForMenuClicks()
}

App.start = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()
    setupState(options)

    const el = document.getElementById('app')

    render(makeRoutes(options.updating), el)
  })
}

App.startUpdateApp = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()

    const el = document.getElementById('updates')

    render(<Updates options={options}/>, el)
  })
}
