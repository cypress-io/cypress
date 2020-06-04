/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const e2ePath = Fixtures.projectPath('e2e')

describe('e2e specs', () => {
  e2e.setup()

  it('failing when no specs found', function () {
    return e2e.exec(this, {
      config: { integrationFolder: 'cypress/specs' },
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('failing when no spec pattern found', function () {
    return e2e.exec(this, {
      spec: 'cypress/integration/**notfound**',
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
