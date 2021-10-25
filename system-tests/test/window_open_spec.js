const systemTests = require('../lib/system-tests').default

describe('e2e window.open', () => {
  systemTests.setup()

  // NOTE: skipping this for now due to snap-shot-it monkey patching causing test failures
  it.skip('passes', function () {
    return systemTests.exec(this, {
      spec: 'window_open_spec.coffee',
      snapshot: true,
    })
  })
})
