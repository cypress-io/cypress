require('@percy/cypress')
const _ = require('lodash')

const installCustomPercyCommand = ({ elementOverrides } = {}) => {
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

    return origFn(screenshotName, {
      widths: opts.widths,
    })
  }

  Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
}

module.exports = installCustomPercyCommand
