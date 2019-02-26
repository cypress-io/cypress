Cypress.on('uncaught:exception', (error, runnable) => {
  error // $ExpectType Error
  runnable // $ExpectType IRunnable
})

Cypress.on('window:confirm', (text) => {
  text // $ExpectType string
})

Cypress.on('window:alert', (text) => {
  text // $ExpectType string
})

Cypress.on('window:before:load', (win) => {
  win // $ExpectType Window
})

Cypress.on('window:load', (win) => {
  win // $ExpectType Window
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
  error // $ExpectType Error
  mocha // $ExpectType IRunnable
})

Cypress.on('viewport:changed', (viewport) => {
  viewport // $ExpectType Viewport
})

Cypress.on('scrolled', ($el) => {
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

Cypress.on('test:before:run', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})

Cypress.on('test:after:run', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})
