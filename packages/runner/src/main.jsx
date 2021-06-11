import { action, configure } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import { utils as driverUtils } from '@packages/driver'

import App from './app/app'
import NoSpec from './errors/no-spec'
import State from './lib/state'
import { Container } from '@packages/runner-shared'
import util from './lib/util'

configure({ enforceActions: 'always' })

const Runner = {
  start (el, base64Config) {
    action('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

      const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG

      const state = new State(NO_COMMAND_LOG ? 0 : (config.state || {}).reporterWidth)

      Runner.state = state
      Runner.configureMobx = configure

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      const container = (
        <Container
          config={config}
          state={state}
          App={App}
          NoSpec={NoSpec}
          hasSpecFile={util.hasSpecFile}
        />
      )

      render(container, el)
    })()
  },
}

window.Runner = Runner
