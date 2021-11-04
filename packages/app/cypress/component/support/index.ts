import { registerMountFn } from '@packages/frontend-shared/cypress/support/common'
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:

import _ from 'lodash'
import 'virtual:windi.css'
import '../../../src/main.scss'
import '@iconify/iconify'
import { createRouter } from '../../../src/router/router'
import { createPinia } from '../../../src/store'
import { Pinia, setActivePinia } from 'pinia'

import '@percy/cypress'

const installCustomPercyCommand = () => {
  const customPercySnapshot = (origFn, name, options = {}) => {
    if (_.isObject(name)) {
      options = name
      name = null
    }

    const opts = _.defaults({}, options, {
      widths: [Cypress.config().viewportWidth],
    })

    /**
     * @type {Mocha.Test}
     */
    const test = cy.state('test')

    const titlePath = test.titlePath()

    const screenshotName = titlePath.concat(name).filter(Boolean).join(' > ')

    // if we're in interactive mode via (cypress open)
    // then bail immediately
    if (Cypress.config().isInteractive) {
      return cy.log('percy: skipping snapshot in interactive mode')
    }

    if (_.isFunction(before)) {
      before()
    }

    // Percy v3.1.0 will timeout waiting for response from server if screenshot
    // takes longer than defaultCommandTimeout, so we hack around it
    // eslint-disable-next-line
    const _backupTimeout = Cypress.config('defaultCommandTimeout')

    Cypress.config('defaultCommandTimeout', 10000)

    origFn(screenshotName, {
      widths: opts.widths,
    })

    cy.then(() => {
      Cypress.config('defaultCommandTimeout', _backupTimeout)
    })

    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

registerMountFn({ plugins: [() => createRouter(), () => pinia] })

installCustomPercyCommand()
