// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  _,
} = Cypress
const {
  $,
} = Cypress

// backup the original config
const ORIG_CONFIG = _.clone(Cypress.config())

beforeEach(() => {
  // restore it before each test
  Cypress.config(ORIG_CONFIG)

  // always set that we're interactive so we
  // get consistent passes and failures when running
  // from CI and when running in GUI mode
  Cypress.config('isInteractive', true)
  // necessary or else snapshots will not be taken
  // and we can't test them
  Cypress.config('numTestsKeptInMemory', 1)

  // remove all event listeners
  // from the window
  // this could fail if this window
  // is a cross origin window
  try {
    return $(cy.state('window')).off()
  } catch (error) {} // eslint-disable-line no-empty
})
