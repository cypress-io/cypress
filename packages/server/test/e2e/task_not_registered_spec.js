const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

describe('e2e task', () => {
  e2e.setup()

  it('fails', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('task-not-registered'),
      spec: 'task_not_registered_spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
