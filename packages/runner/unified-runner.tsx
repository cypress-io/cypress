import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

import { dom } from './src/dom'
import { highlight } from './src/selector-playground'

export const UnifiedRunner = {
  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  dom,
  highlight,

  shortcuts,

  React,

  MobX,

  ReactDOM,

  Reporter,
}
