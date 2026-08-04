import React from 'react'
import { createRoot } from 'react-dom/client'
import $Cypress from '@packages/driver'
import { Reporter } from '@packages/reporter/src/main'
import shortcuts from '@packages/reporter/src/lib/shortcuts'
import { setReporterDocument } from '@packages/reporter/src/lib/reporter-document'
import * as MobX from 'mobx'

export const UnifiedRunner = {
  CypressJQuery: $Cypress.$,

  CypressDriver: $Cypress,

  shortcuts,

  setReporterDocument,

  React,

  MobX,

  ReactDOM: {
    createRoot,
  },

  Reporter,
}
