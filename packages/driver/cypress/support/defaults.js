const { $ } = Cypress

let isActuallyInteractive

beforeEach(() => {
  isActuallyInteractive = Cypress.config('isInteractive')

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
