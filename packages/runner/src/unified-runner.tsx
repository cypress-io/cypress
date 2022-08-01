import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import * as MobX from 'mobx'

import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'

import {
  StudioRecorder,
  dom,
} from './interactive'

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
