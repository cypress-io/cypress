Cypress.on('uncaught:exception', (error, runnable) => {
  error // $ExpectType Error
  runnable // $ExpectType IRunnable
})

Cypress.on('page:confirm', (text) => {
  text // $ExpectType string
})

Cypress.on('page:alert', (text) => {
  text // $ExpectType string
})

Cypress.on('page:start', (win) => {
  win // $ExpectType Window
})

Cypress.on('page:ready', (win) => {
  win // $ExpectType Window
})

Cypress.on('before:window:unload', (event) => {
  event // $ExpectType BeforeUnloadEvent
})

Cypress.on('page:end', (event) => {
  event // $ExpectType Event
})

Cypress.on('page:url:changed', (url) => {
  url // $ExpectType string
})

Cypress.on('test:fail', (error, mocha) => {
  error // $ExpectType Error
  mocha // $ExpectType IRunnable
})

Cypress.on('viewport:changed', (viewport) => {
  viewport // $ExpectType Viewport
})

Cypress.on('internal:scrolled', ($el) => {
  $el // $ExpectType JQuery<HTMLElement>
})

Cypress.on('command:enqueued', (command) => {
  command // $ExpectType EnqueuedCommand
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

Cypress.on('test:run:start', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})

Cypress.on('test:run:end', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})
