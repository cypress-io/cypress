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

Cypress.on('page:start', (details) => {
  details // $ExpectType PageDetails
})

Cypress.on('page:ready', (details) => {
  details // $ExpectType PageDetails
})

Cypress.on('page:end', (details) => {
  details // $ExpectType PageDetails
})

Cypress.on('before:window:unload', (event) => {
  event // $ExpectType BeforeUnloadEvent
})

Cypress.on('page:url:changed', (url) => {
  url // $ExpectType string
})

Cypress.on('test:fail', (error, mocha) => {
  error // $ExpectType Error
  mocha // $ExpectType IRunnable
})

Cypress.on('viewport:change', (viewport) => {
  viewport // $ExpectType Viewport
})

Cypress.on('internal:scrolled', ($el) => {
  $el // $ExpectType JQuery<HTMLElement>
})

Cypress.on('internal:commandEnqueue', (command) => {
  command // $ExpectType EnqueuedCommand
})

Cypress.on('internal:commandStart', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('internal:commandEnd', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('internal:commandRetry', (command) => {
  command // $ExpectType CommandQueue
})

Cypress.on('internal:log', (log, interactive: boolean) => {
  log // $ExpectTyped any
})

Cypress.on('internal:logChange', (log, interactive: boolean) => {
  log // $ExpectTyped any
})

Cypress.on('test:start', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})

Cypress.on('test:end', (attributes , test) => {
  attributes // $ExpectType ObjectLike
  test // $ExpectType ITest
})
