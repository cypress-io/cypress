// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default

describe('e2e return value', () => {
  e2e.setup()

  it('failing1', function () {
    return e2e.exec(this, {
      spec: 'return_value_spec.coffee',
      snapshot: true,
      expectedExitCode: 3,
    })
  })
})
