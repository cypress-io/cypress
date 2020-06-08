const e2e = require('../support/helpers/e2e').default

describe('e2e window.open', () => {
  e2e.setup()

  // NOTE: skipping this for now due to snap-shot-it monkey patching causing test failures
  it.skip('passes', function () {
    return e2e.exec(this, {
      spec: 'window_open_spec.coffee',
      snapshot: true,
    })
  })
})
