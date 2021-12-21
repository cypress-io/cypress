import React from 'react'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
const driverUtils = $Cypress.utils
import { Container, selectorPlaygroundModel, StudioRecorder } from '@packages/runner-shared'
import { EventManager } from '@packages/app/src/runner/event-manager'
import defaultEvents from '@packages/reporter/src/lib/events'
import * as MobX from 'mobx'
import { createWebsocket } from '@packages/app/src/runner'
import { UnifiedRunner } from '../unified-runner'

export function getSpecUrl (namespace: string, spec: FoundSpec, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

// @ts-ignore
window.UnifiedRunner = UnifiedRunner

/** This is the OG runner-ct */
import type { FoundSpec } from '@packages/types/src/spec'

import App from './app/RunnerCt'
import State from './lib/state'
import util from './lib/util'

MobX.configure({ enforceActions: 'always' })

const Runner: any = {
  emit (evt: string, ...args: unknown[]) {
    defaultEvents.emit(evt, ...args)
  },

  start (el, base64Config) {
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

    MobX.action('started', () => {
      const config = JSON.parse(driverUtils.decodeBase64Unicode(base64Config))

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

      MobX.autorun(() => {
        const { spec } = state

        if (spec) {
          util.updateSpecPath(spec.name)
        }
      })

      Runner.state = state
      Runner.configureMobx = MobX.configure

      state.updateDimensions(config.viewportWidth, config.viewportHeight)

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

      ReactDOM.render(container, el)
    })()
  },
}

// @ts-ignore
window.Runner = Runner
