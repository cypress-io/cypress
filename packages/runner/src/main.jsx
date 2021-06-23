import { action, autorun, configure } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import { utils as driverUtils } from '@packages/driver'

import App from './app/app'
import NoSpec from './errors/no-spec'
import State from './lib/state'
import { Container, eventManager } from '@packages/runner-shared'
import util from './lib/util'

configure({ enforceActions: 'always' })

const Runner = {
  start (el, base64Config) {
    action('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

      const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG

      const state = new State({
        reporrterWidth: NO_COMMAND_LOG ? 0 : (config.state || {}).reporterWidth,
        specs: config.specs,
      })

      Runner.state = state
      Runner.configureMobx = configure

      const setSpecByUrlHash = () => {
        const specPath = util.integrationSpecPath()

        if (specPath) {
          state.updateSpecByUrl(specPath)
        }
      }

      setSpecByUrlHash()

      autorun(() => {
        const { spec } = state

        if (spec) {
          util.updateIntegrationSpecPath(spec.name)
        }
      })

      window.addEventListener('hashchange', setSpecByUrlHash)

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      const container = (
        <Container
          config={config}
          runner='e2e'
          state={state}
          App={App}
          NoSpec={NoSpec}
          hasSpecFile={util.hasSpecFile}
          eventManager={eventManager}
        />
      )

      render(container, el)
    })()
  },
}

window.Runner = Runner
