// Add cy.mount, cy.mountFragment, cy.mountFragmentList
export * from './mock-graphql/mountFragment'

import type { SnapshotOptions } from '@percy/core'

import _ from 'lodash'
import type { Component } from 'vue'

export function addVueCommand () {
  Cypress.Commands.add('vue', (componentToFind = null) => {
    if (componentToFind) {
      return cy.wrap(Cypress.vueWrapper.findComponent(componentToFind))
    }

    return cy.wrap(Cypress.vueWrapper)
  })
}

export function installCustomPercyCommand () {
  const customPercySnapshot = (origFn: (...args: unknown[]) => void, name: any, options: any) => {
    if (_.isObject(name)) {
      options = name
      name = null
    }

    const opts = _.defaults({}, options, {
      widths: [Cypress.config().viewportWidth],
    })

    // @ts-ignore
    const test: Mocha.Test = cy.state('test')

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

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /**
       * return Vue Test Utils wrapper wrapped in a cypress chainable
       */
      vue(componentToFind?: Component): Cypress.Chainable<any>
      /**
       * Percy snapshots - default implementation
       */
      percySnapshot(name?: string, options?: SnapshotOptions): Chainable<Subject>
      /**
       * Percy snapshot with custom callback
       *
       * Useful for things like modifying non-deterministic UI that leads
       * to false positives, like the time to run a test in the reporter.
       */
      percySnapshot(origFn: (...args: unknown[]) => void, name: any, options: any): Chainable<Subject>
    }
  }
}

import { initHighlighter } from '@cy/components/ShikiHighlight.vue'

// Make sure highlighter is initialized before
// we show any code to avoid jank at rendering
// @ts-ignore
initHighlighter()
