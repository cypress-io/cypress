import { runSpec } from './support/spec-loader'

describe('src/cypress/runner ui states', { retries: 0, defaultCommandTimeout: 600000, viewportHeight: 2500, viewportWidth: 1000 }, () => {
  it('common ui states', () => {
    runSpec({
      fileName: 'ui-states.runner.cy.js',
    })
    .then((win) => {
      return new Promise<void>((resolve) => {
        win.getEventManager().on('cypress:in:cypress:run:complete', () => {
          resolve()
        })
      }).then(() => {
        cy.contains('test hooks').scrollIntoView().click()
        cy.percySnapshot('ui-states: test hooks')
        cy.contains('test hooks').click()

        cy.contains('commands that dont display in UI').scrollIntoView().click()
        cy.percySnapshot('ui-states: commands that dont display in UI')
        cy.contains('commands that dont display in UI').click()

        cy.contains('commands that display in UI').scrollIntoView().click()
        cy.percySnapshot('ui-states: commands that display in UI')
        cy.contains('commands that display in UI').click()

        cy.contains('command options').scrollIntoView().click()
        cy.percySnapshot('ui-states: command options')
        cy.contains('command options').click()

        cy.contains('Element Visibility').scrollIntoView().click()
        cy.percySnapshot('ui-states: Element Visibility')
        cy.contains('Element Visibility').click()

        cy.contains('Request Statuses').scrollIntoView().click()
        cy.percySnapshot('ui-states: Request Statuses')
        cy.contains('Request Statuses').click()

        cy.contains('page events').scrollIntoView().click()
        cy.percySnapshot('ui-states: page events')
        cy.contains('page events').click()

        cy.contains('events - page events').scrollIntoView().click()
        cy.percySnapshot('ui-states: events - page events')
        cy.contains('events - page events').click()

        cy.contains('simple error with docs link').scrollIntoView().click()
        cy.percySnapshot('ui-states: simple error with docs link')
        cy.contains('simple error with docs link').click()

        cy.contains('long error').scrollIntoView().click()
        cy.percySnapshot('ui-states: long error')
        cy.contains('long error').click()

        cy.contains('Nested Tests').scrollIntoView().click()
        cy.percySnapshot('ui-states: Nested Tests')
        cy.contains('Nested Tests').click()
      })
    })
  })
})
