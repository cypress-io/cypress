import './main.scss'
import { action, useStrict } from 'mobx'
import React from 'react'
import { render } from 'react-dom'

import State from './lib/state'
import Container from './app/container'

useStrict(true)

window.Runner = {
  start (el, config) {
    action('started', () => {
      const state = new State((config.state || {}).reporterWidth)

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      render(<Container config={config} state={state} />, el)
    })()
  },
}
