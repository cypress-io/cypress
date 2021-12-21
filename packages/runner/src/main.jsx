import * as MobX from 'mobx'
import React from 'react'
import { render } from 'react-dom'
import $Cypress from '@packages/driver'

import App, { SPEC_LIST_WIDTH } from './app/app'
import NoSpec from './errors/no-spec'
import State from './lib/state'
import { Container, selectorPlaygroundModel, StudioRecorder } from '@packages/runner-shared'
import { EventManager } from '@packages/app/src/runner/event-manager'
import { createWebsocket } from '@packages/app/src/runner'
import util from './lib/util'
import { UnifiedRunner } from '@packages/runner-ct/unified-runner'

const driverUtils = $Cypress.utils

window.UnifiedRunner = UnifiedRunner

MobX.configure({ enforceActions: 'always' })

const ws = createWebsocket()

// NOTE: this is exposed for testing, ideally we should only expose this if a test flag is set
window.runnerWs = ws
window.ws = ws

const eventManager = new EventManager(
  $Cypress,
  MobX,
  selectorPlaygroundModel,
  StudioRecorder,
  ws,
)

// NOTE: this is for testing Cypress-in-Cypress, window.Cypress is undefined here
// unless Cypress has been loaded into the AUT frame
if (window.Cypress) {
  window.eventManager = eventManager
}

const Runner = {
  start (el, base64Config) {
    MobX.action('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

      const NO_COMMAND_LOG = config.env && config.env.NO_COMMAND_LOG
      const useInlineSpecList = (config.env || {}).CypressInternal_UseInlineSpecList

      const state = new State({
        reporterWidth: NO_COMMAND_LOG ? 0 : (config.state || {}).reporterWidth,
        specs: config.specs,
        useInlineSpecList,
        specListWidth: NO_COMMAND_LOG ? 0 : useInlineSpecList ? SPEC_LIST_WIDTH : 0,
      })

      Runner.state = state
      Runner.configureMobx = MobX.configure

      const setSpecByUrlHash = () => {
        const specPath = util.integrationSpecPath()

        if (specPath) {
          state.updateSpecByUrl(specPath)
        }
      }

      setSpecByUrlHash()

      MobX.autorun(() => {
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
