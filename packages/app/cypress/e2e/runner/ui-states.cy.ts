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
        cy.get('[data-cy="reporter-panel"]').within(() => {
          cy.contains('test hooks').as('testHooks')
          cy.contains('commands that dont display in UI').as('commandsDontDisplayInUI')
          cy.contains('commands that display in UI').as('commandsDisplayInUI')
          cy.contains('command options').as('commandOptions')
          cy.contains('Element Visibility').as('elementVisibility')
          cy.contains('Request Statuses').as('requestStatuses')
          cy.contains('page events').as('pageEvents')
          cy.contains('events - page events').as('eventsPageEvents')
          cy.contains('simple error with docs link').as('simpleErrorWithDocsLink')
          cy.contains('long error').as('longError')
          cy.contains('Nested Tests').as('nestedTests')

          cy.get('.container').first().scrollTo('top')
          cy.get('@testHooks').should('be.visible')
          cy.get('@testHooks').click()
          cy.percySnapshot('ui-states: test hooks')
          cy.get('@testHooks').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@commandsDontDisplayInUI').should('be.visible')
          cy.get('@commandsDontDisplayInUI').click()
          cy.percySnapshot('ui-states: commands that dont display in UI')
          cy.get('@commandsDontDisplayInUI').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@commandsDisplayInUI').should('be.visible')
          cy.get('@commandsDisplayInUI').click()
          cy.percySnapshot('ui-states: commands that display in UI')
          cy.get('@commandsDisplayInUI').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@commandOptions').should('be.visible')
          cy.get('@commandOptions').click()
          cy.percySnapshot('ui-states: command options')
          cy.get('@commandOptions').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@elementVisibility').should('be.visible')
          cy.get('@elementVisibility').click()
          cy.percySnapshot('ui-states: Element Visibility')
          cy.get('@elementVisibility').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@requestStatuses').should('be.visible')
          cy.percySnapshot('ui-states: Request Statuses')
          cy.get('@requestStatuses').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@pageEvents').should('be.visible')
          cy.get('@pageEvents').click()
          cy.percySnapshot('ui-states: page events')
          cy.get('@pageEvents').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@eventsPageEvents').should('be.visible')
          cy.percySnapshot('ui-states: events - page events')
          cy.get('@eventsPageEvents').click()

          cy.get('.container').first().scrollTo('top')
          cy.get('@simpleErrorWithDocsLink').should('be.visible')
          cy.percySnapshot('ui-states: simple error with docs link')
          cy.get('@simpleErrorWithDocsLink').click()

          cy.get('@longError').should('be.visible')
          cy.percySnapshot('ui-states: long error')
          cy.get('@longError').click()

          cy.get('@nestedTests').should('be.visible')
          cy.get('@nestedTests').click()
          cy.percySnapshot('ui-states: Nested Tests')
          cy.get('@nestedTests').click()
        })
      })
    })
  })
})
