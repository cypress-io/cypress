const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

describe('e2e issue 2891', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/2891
  it('passes', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('default-layout'),
      spec: 'default_layout_spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })
})
