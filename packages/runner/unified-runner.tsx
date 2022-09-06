import React from 'react'
import ReactDOM from 'react-dom'
import $Cypress from '@packages/driver'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import * as MobX from 'mobx'

import selectorPlayground from './src/selector-playground'
import { dom } from './src/dom'
import { studioAssertionsMenu } from './src/studio/assertions-menu'

export const UnifiedRunner = {
  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  selectorPlayground,

  dom,

  studioAssertionsMenu,

  shortcuts,

  React,

  MobX,

  ReactDOM,

  Reporter,
}
