require('@percy/cypress')
const _ = require('lodash')

function customPercySnapshot (
  origFn,
  name,
  options = {},
) {
  if (_.isObject(name)) {
    options = name
    name = null
  }

  const opts = _.defaults({}, options, {
    elementOverrides: { '.stats .duration': ($el) => $el.text('XX.XX') },
  })

  /**
   * @type {Mocha.Test}
   */
  const test = cy.state('test')

  const titlePath = test.titlePath()

  const screenshotName = titlePath.concat(name).filter(Boolean).join(' > ')

  _.each(opts.elementOverrides, (v, k) => v(cy.$$(k)))

  // if we're in interactive mode via (cypress open)
  // then bail immediately
  if (Cypress.config().isInteractive) {
    return cy.log('percy: skipping snapshot in interactive mode')
  }

  return origFn(screenshotName)
}
Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
