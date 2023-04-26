import { expectType } from "."

Cypress.on('uncaught:exception', (error, runnable, promise) => {
expectType<Error>(  error)
expectType<Mocha.Runnable>(  runnable)
expectType<Promise<any> | undefined>(  promise)
})

Cypress.on('window:confirm', (text) => {
expectType<string>(  text)
})

Cypress.on('window:alert', (text) => {
expectType<string>(  text)
})

Cypress.on('window:before:load', (win) => {
expectType<Cypress.AUTWindow>(  win)
})

Cypress.on('window:load', (win) => {
expectType<Cypress.AUTWindow>(  win)
})

Cypress.on('window:before:unload', (event) => {
expectType<BeforeUnloadEvent>(  event)
})

Cypress.on('window:unload', (event) => {
expectType<Event>(  event)
})

Cypress.on('url:changed', (url) => {
expectType<string>(  url)
})

Cypress.on('fail', (error, mocha) => {
expectType<Cypress.CypressError>(  error)
expectType<Mocha.Runnable>(  mocha)
})

Cypress.on('viewport:changed', (viewport) => {
expectType<Cypress.Viewport>(  viewport)
})

Cypress.on('scrolled', ($el) => {
expectType<JQuery<HTMLElement>>(  $el)
})

Cypress.on('command:enqueued', (command) => {
expectType<Cypress.EnqueuedCommandAttributes>(  command)
})

Cypress.on('command:start', (command) => {
expectType<Cypress.CommandQueue>(  command)
})

Cypress.on('command:end', (command) => {
expectType<Cypress.CommandQueue>(  command)
})

Cypress.on('command:retry', (command) => {
expectType<Cypress.CommandQueue>(  command)
})

Cypress.on('log:added', (attributes, log) => {
expectType<Cypress.ObjectLike>(  attributes)
  log // $ExpectTyped any
})

Cypress.on('log:changed', (attributes, log) => {
expectType<Cypress.ObjectLike>(  attributes)
  log // $ExpectTyped any
})

Cypress.on('mocha.test:before:run', (attributes , test) => {
expectType<Cypress.ObjectLike>(  attributes)
expectType<Mocha.Test>(  test)
})

Cypress.on('Mocha.Test:before:run:async', (attributes , test) => {
expectType<Cypress.ObjectLike>(  attributes)
expectType<Mocha.Test>(  test)
})

Cypress.on('Mocha.Test:after:run', (attributes , test) => {
expectType<Cypress.ObjectLike>(  attributes)
expectType<Mocha.Test>(  test)
})

namespace Tests {
  cy.get('el').clear({scrollBehavior: 'top'})
  cy.get('el').check({scrollBehavior: 'bottom'})
  cy.get('el').type('hello', {scrollBehavior: 'center'})
  cy.get('el').trigger('mousedown', {scrollBehavior: 'nearest'})
  cy.get('el').click({scrollBehavior: false})
  // @ts-expect-error
  cy.get('el').click({scrollBehavior: true}) 
}

// https://github.com/cypress-io/cypress/pull/21286
// `waitFor` doesn't exist in Node EventEmitter
// and it confuses the users with `cy.wait`
namespace Tests {
  // @ts-expect-error
  cy.waitFor()
  cy.on('random', () => {})
  cy.removeAllListeners()
  cy.removeListener('a', () => {})

  // @ts-expect-error
  Cypress.waitFor()
  Cypress.on('random', () => {})
  Cypress.removeAllListeners()
  Cypress.removeListener('a', () => {})
}
