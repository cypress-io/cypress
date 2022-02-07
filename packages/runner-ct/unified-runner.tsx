import React from 'react'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import {
  selectorPlaygroundModel,
  StudioRecorder,
  dom,
  blankContents,
  visitFailure,
} from '@packages/runner-shared'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

export const UnifiedRunner = {
  _,

  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

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
}
