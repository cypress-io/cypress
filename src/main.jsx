import { useStrict } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import App from './app/app'
import AppGlobal from './lib/app'
import ipc from './lib/ipc'

useStrict(true)

AppGlobal.start = (mode) => {
  ipc('get:options').then((options = {}) => {
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
        render(<App options={options} />, el)
    }
  })
}
