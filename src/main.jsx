import { useStrict } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import _ from 'lodash'

import Application from './app/application'

import App from './lib/app'
import ipc from './lib/ipc'

useStrict(true)

App.start = (mode) => {
  ipc('get:options')
  .then((options = {}) => {
    const sendErr = function (err) {
      return App.ipc("gui:error", _.pick(err, "name", "message", "stack"))
    }

    window.onerror = function (message, source, lineno, colno, err) {
      return sendErr(err)
    }

    window.onunhandledrejection = function (evt) {
      return sendErr(evt.reason)
    }

    const el = document.getElementById('app')

    switch (mode) {
      case 'about':
        // render about
        break
      case 'debug':
        // render debug
        break
      case 'updates':
        // render updates
        break
      default:
        render(<Application options={options} />, el)
    }
  })
}
