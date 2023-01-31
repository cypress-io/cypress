import '@packages/frontend-shared/cypress/support/e2e'
import 'cypress-real-events/support'
import './execute-spec'

Cypress.on('window:before:load', (win) => {
  // Can set this in a spec-by-spec basis to 'true' to use
  // graphql over fetch instead of web sockets.
  // This allows you to intercept GraphQL with `cy.intercept`.
  // By default, we use web sockets.
  win.__CYPRESS_GQL_NO_SOCKET__ = undefined
})

beforeEach(() => {
  // this is always 0, since we only destroy the AUT when using
  // `experimentalSingleTabRunMode, which is not a valid experiment for for e2e testing.
  // @ts-ignore - dynamically defined during tests using
  expect(window.top?.getEventManager().autDestroyedCount).to.be.undefined
})
