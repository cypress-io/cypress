// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default

describe('e2e issue 173', () => {
  e2e.setup()

  // https://github.com/cypress-io/cypress/issues/173

  return e2e.it('failing', {
    spec: 'issue_173_spec.coffee',
    snapshot: true,
    expectedExitCode: 1,
  })
})
