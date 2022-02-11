require('@percy/cypress')
const _ = require('lodash')

// declare namespace Cypress {
//   interface Chainable<Subject> {
//     percySnapshot(
//       name?: string,
//       options?: SnapshotOptions & {
//         elementOverrides: any
//       }
//     ): Chainable<Subject>
//   }
// }

export const installCustomPercyCommand = ({ before, elementOverrides } = {}) => {
  const customPercySnapshot = (origFn, name, options = {}) => {
    if (_.isObject(name)) {
      options = name
      name = null
    }

    const { viewportWidth, viewportHeight } = cy.state()

    const opts = {
      width: options.width || viewportWidth,
      elementOverrides: {
        ...elementOverrides,
        ...options.elementOverrides,
      },
    }

    /**
     * @type {Mocha.Test}
     */
    const test = cy.state('test')

    const titlePath = test.titlePath()

    const screenshotName = titlePath.concat(name).filter(Boolean).join(' > ')

    _.each(opts.elementOverrides, (v, k) => {
      // eslint-disable-next-line cypress/no-assigning-return-values
      const $el = cy.$$(k)

      if (_.isFunction(v)) {
        v($el)

        return
      }

      if (v === 'displayNone') {
        $el.attr('style', 'display: none !important')

        return
      }

      $el.css({ visibility: 'hidden' })
    })

    if (options.width) {
      cy.viewport(options.width, viewportHeight)
    }

    // if we're in interactive mode via (cypress open)
    // then bail immediately
    if (Cypress.config().isInteractive) {
      // const log = Cypress.log('...')

      // log.snapshot('before', { next: 'after'})
      cy.log('percy: skipping snapshot in interactive mode')
    }

    if (options.width) {
      cy.viewport(viewportWidth, viewportHeight)
    }

    if (Cypress.config().isInteractive) {
      return
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
      widths: [],
    })

    cy.then(() => {
      Cypress.config('defaultCommandTimeout', _backupTimeout)
    })

    // restore dom
    // log.snapshot()

    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}
