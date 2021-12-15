import 'regenerator-runtime/runtime'
import _ from 'lodash'
import * as MobX from 'mobx'
import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import defaultEvents from '@packages/reporter/src/lib/events'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import { Reporter } from '@packages/reporter/src/main'
import {
  blankContents, dom, logger, selectorPlaygroundModel, visitFailure, AutIframe, StudioRecorder,
} from '@packages/runner-shared'

const driverUtils = $Cypress.utils

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
