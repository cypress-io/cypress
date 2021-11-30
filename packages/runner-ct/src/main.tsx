import React from 'react'
import 'regenerator-runtime/runtime'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
const driverUtils = $Cypress.utils
import { AutIframe, Container, selectorPlaygroundModel, StudioRecorder, logger, dom, blankContents, visitFailure } from '@packages/runner-shared'
import { EventManager } from '@packages/app/src/runner/event-manager'
import defaultEvents from '@packages/reporter/src/lib/events'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

export function getSpecUrl (namespace: string, spec: FoundSpec, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

const eventManager = new EventManager(
  $Cypress,
  MobX,
  selectorPlaygroundModel,
  StudioRecorder,
)

const UnifiedRunner = {
  _,

  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  logger,

  dom,

  blankContents,

  StudioRecorder,

  selectorPlaygroundModel,

  shortcuts,

  visitFailure,

  React,

  MobX,

  ReactDOM,

  Reporter,

  AutIframe,

  defaultEvents,

  decodeBase64: (base64: string) => {
    return JSON.parse(driverUtils.decodeBase64Unicode(base64))
  },

  emit (evt: string, ...args: unknown[]) {
    defaultEvents.emit(evt, ...args)
  },
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
