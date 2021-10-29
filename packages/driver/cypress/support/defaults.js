const { $ } = Cypress

beforeEach(() => {
  const isActuallyInteractive = Cypress.config('isInteractive')

  // always set that we're interactive so we
  // get consistent passes and failures when running
  // from CI and when running in GUI mode
  Cypress.config('isInteractive', true)

  if (!isActuallyInteractive) {
    Cypress.config({
      // necessary or else snapshots will not be taken
      // and we can't test them
      'numTestsKeptInMemory': 1,
      // forcing interactive mode so force retries
      // when test started in 'runMode'
      // only want retries for 'runMode'
      'config': 2,
    })
  }

  // remove all event listeners
  // from the window
  // this could fail if this window
  // is a cross origin window
  try {
    $(cy.state('window')).off()
  } catch (error) {} // eslint-disable-line no-empty
})
