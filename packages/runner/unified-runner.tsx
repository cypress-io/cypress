import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

import { StudioRecorder } from './src/studio'
import selectorPlayground from './src/selector-playground'

export const UnifiedRunner = {
  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  selectorPlayground,

  shortcuts,

  React,

  MobX,

  ReactDOM,

  Reporter,
}
