import React from 'react'
import 'regenerator-runtime/runtime'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
const driverUtils = $Cypress.utils
import { AutIframe, selectorPlaygroundModel, StudioRecorder, logger, dom, blankContents, visitFailure } from '@packages/runner-shared'
import defaultEvents from '@packages/reporter/src/lib/events'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

export const UnifiedRunner = {
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
