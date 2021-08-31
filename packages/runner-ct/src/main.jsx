import { autorun, action, configure } from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import $Cypress from '@packages/driver'
import defaultEvents from '@packages/reporter/src/lib/events'

import App from './app/RunnerCt'
import State from './lib/state'
import { Container, eventManager } from '@packages/runner-shared'
import util from './lib/util'

// to support async/await
import 'regenerator-runtime/runtime'

configure({ enforceActions: 'always' })

const Runner = {
  emit (evt, ...args) {
    defaultEvents.emit(evt, ...args)
  },

  start (el, base64Config) {
    action('started', () => {
      const config = JSON.parse($Cypress.utils.decodeBase64Unicode(base64Config))

      const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG
      const configState = config.state || {}

      if (NO_COMMAND_LOG) {
        configState.reporterWidth = 0
      }

      configState.specs = config.specs

      const ctRunnerSpecificDefaults = {
        reporterWidth: config.state.ctReporterWidth,
        isSpecsListOpen: config.state.ctIsSpecsListOpen,
        specListWidth: config.state.ctSpecListWidth,
      }
      const state = new State({ ...configState, ...ctRunnerSpecificDefaults }, config ?? {})

      const setSpecByUrlHash = () => {
        const specPath = util.specPath()

        if (specPath) {
          state.updateSpecByUrl(specPath)
        }
      }

      setSpecByUrlHash()

      // anytime the hash changes, see if we need to set a new spec
      window.addEventListener('hashchange', setSpecByUrlHash)

      autorun(() => {
        const { spec } = state

        if (spec) {
          util.updateSpecPath(spec.name)
        }
      })

      Runner.state = state
      Runner.configureMobx = configure

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

      debugger

      const container = (
        <Container
          config={config}
          runner='component'
          state={state}
          App={App}
          hasSpecFile={util.hasSpecFile}
          eventManager={eventManager}
        />
      )

      render(container, el)
    })()
  },
}

window.Runner = Runner
export { Runner }
