const { $ } = Cypress

const isActuallyInteractive = Cypress.config('isInteractive')

window.top.__cySkipValidateConfig = true

if (!isActuallyInteractive) {
  // we want to only enable retries in runMode
  // and because we set `isInteractive` above
  // we have to set retries here
  Cypress.config('retries', 2)
}

let ranPrivilegedCommandsInBeforeEach = false

beforeEach(function () {
  // always set that we're interactive so we
  // get consistent passes and failures when running
  // from CI and when running in GUI mode
  Cypress.config('isInteractive', true)

  if (!isActuallyInteractive) {
    // necessary or else snapshots will not be taken
    // and we can't test them
    Cypress.config('numTestsKeptInMemory', 1)
  }

  // remove all event listeners
  // from the window
  // this could fail if this window
  // is a cross origin window
  try {
    $(cy.state('window')).off()
  } catch (error) {} // eslint-disable-line no-empty

  // only want to run this as part of the privileged commands spec
  if (cy.config('spec').baseName === 'privileged_commands.cy.ts') {
    cy.visit('/fixtures/files-form.html')

    // it only needs to run once per spec run
    if (ranPrivilegedCommandsInBeforeEach) return

    ranPrivilegedCommandsInBeforeEach = true

    cy.exec('echo "hello"')
    cy.readFile('cypress/fixtures/app.json')
    cy.writeFile('cypress/_test-output/written.json', 'contents')
    cy.task('return:arg', 'arg')
    cy.get('#basic').selectFile('cypress/fixtures/valid.json')
    if (!Cypress.isBrowser({ family: 'webkit' })) {
      cy.origin('http://foobar.com:3500', () => {})
    }
  }
})

// this is here to test that cy.origin() dependencies used directly in the
// support file work properly
Cypress.Commands.add('originLoadUtils', (origin) => {
  cy.origin(origin, () => {
    Cypress.require('./utils')
  })
})
