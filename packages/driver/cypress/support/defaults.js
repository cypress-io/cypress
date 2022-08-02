const { $ } = Cypress

const isActuallyInteractive = Cypress.config('isInteractive')

window.top.__cySkipValidateConfig = true

if (!isActuallyInteractive) {
  // we want to only enable retries in runMode
  // and because we set `isInteractive` above
  // we have to set retries here
  Cypress.config('retries', 2)
}

beforeEach(() => {
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
})
