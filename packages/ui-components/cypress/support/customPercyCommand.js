require('@percy/cypress')
const _ = require('lodash')

const installCustomPercyCommand = ({ before, elementOverrides } = {}) => {
  const customPercySnapshot = (origFn, name, options = {}) => {
    if (_.isObject(name)) {
      options = name
      name = null
    }

    const opts = _.defaults({}, options, {
      elementOverrides,
      widths: [Cypress.config().viewportWidth],
    })

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

      $el.css({ visibility: 'hidden' })
    })

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
    const _backupTimeout = cy.timeout()

    cy.timeout(10000)

    origFn(screenshotName, {
      widths: opts.widths,
    })

    cy.then(() => {
      cy.timeout(_backupTimeout)
    })

    return
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}

module.exports = installCustomPercyCommand
