import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

import { StudioRecorder } from './src/studio'
import { dom } from './src/dom'

export const UnifiedRunner = {
  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  dom,

  StudioRecorder,

  shortcuts,

  React,

  MobX,

  ReactDOM,

  Reporter,
}
