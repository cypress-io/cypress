const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

describe('e2e task', () => {
  systemTests.setup()

  it('fails', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('task-not-registered'),
      spec: 'task_not_registered_spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
