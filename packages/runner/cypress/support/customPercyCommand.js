require('@percy/cypress')

function customPercySnapshot (
  origFn,
  name,
) {
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

  return origFn(screenshotName)
}
Cypress.Commands.overwrite('percySnapshot', customPercySnapshot)
