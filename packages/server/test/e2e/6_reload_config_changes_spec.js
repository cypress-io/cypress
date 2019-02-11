/* eslint-env mocha */
const e2e = require('../support/helpers/e2e')

describe('e2e reload config changes', () => {
  e2e.setup()

  it('passes', function () {
    return e2e.exec(this, {
      spec: 'reload_config_changes.js',
      snapshot: true,
      expectedExitCode: 0,
      simulateOpenMode: true,
    })
  })
})
