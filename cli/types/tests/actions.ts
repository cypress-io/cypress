Cypress.on('uncaught:exception', (error, runnable, promise) => {
  error // $ExpectType Error
  runnable // $ExpectType Runnable
  promise // $ExpectType Promise<any> | undefined
})

Cypress.on('window:confirm', (text) => {
  text // $ExpectType string
})

Cypress.on('window:alert', (text) => {
  text // $ExpectType string
})

Cypress.on('window:before:load', (win) => {
  win // $ExpectType AUTWindow
})

Cypress.on('window:load', (win) => {
  win // $ExpectType AUTWindow
})

Cypress.on('window:before:unload', (event) => {
  event // $ExpectType BeforeUnloadEvent
})

Cypress.on('window:unload', (event) => {
  event // $ExpectType Event
})

Cypress.on('url:changed', (url) => {
  url // $ExpectType string
})

Cypress.on('fail', (error, mocha) => {
  error // $ExpectType CypressError
  mocha // $ExpectType Runnable
})

Cypress.on('viewport:changed', (viewport) => {
  viewport // $ExpectType Viewport
})

Cypress.on('scrolled', ($el) => {
  $el // $ExpectType JQuery<HTMLElement>
})

Cypress.on('command:enqueued', (command) => {
  command // $ExpectType EnqueuedCommandAttributes
})

Cypress.on('command:start', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('command:end', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('command:retry', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('log:added', (log, interactive: boolean) => {
  log // $ExpectTyped any
})

Cypress.on('log:changed', (log, interactive: boolean) => {
  log // $ExpectTyped any
})

Cypress.on('test:before:run', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType Test
})

Cypress.on('test:after:run', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType Test
})

namespace CypressActionCommandOptionTests {
  cy.get('el').clear({scrollBehavior: 'top'})
  cy.get('el').check({scrollBehavior: 'bottom'})
  cy.get('el').type('hello', {scrollBehavior: 'center'})
  cy.get('el').trigger('mousedown', {scrollBehavior: 'nearest'})
  cy.get('el').click({scrollBehavior: false})
  cy.get('el').click({scrollBehavior: true}) // $ExpectError
}

// https://github.com/cypress-io/cypress/pull/21286
// `waitFor` doesn't exist in Node EventEmitter
// and it confuses the users with `cy.wait`
namespace CyEventEmitterTests {
  cy.waitFor() // $ExpectError
  cy.on('random', () => {})
  cy.removeAllListeners()
  cy.removeListener('a', () => {})

  Cypress.waitFor() // $ExpectError
  Cypress.on('random', () => {})
  Cypress.removeAllListeners()
  Cypress.removeListener('a', () => {})
}
