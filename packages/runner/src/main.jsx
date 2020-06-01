import { action, configure } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import { utils as driverUtils } from '@packages/driver'

import State from './lib/state'
import Container from './app/container'

configure({ enforceActions: 'always' })

const Runner = {
  start (el, base64Config) {
    action('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

      const state = new State((config.state || {}).reporterWidth)

      Runner.state = state
      Runner.configureMobx = configure

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      render(<Container config={config} state={state} />, el)
    })()
  },
}

window.Runner = Runner
