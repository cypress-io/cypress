const systemTests = require('../lib/system-tests').default

describe('e2e task', () => {
  systemTests.setup()

  it('handles undefined return and includes stack trace in error', function () {
    return systemTests.exec(this, {
      spec: 'task.cy.js',
      snapshot: true,
      expectedExitCode: 2,
    })
    .then(({ stdout }) => {
      // should include a stack trace from plugins file
      const match = stdout.match(/at errors(.*)\n/)

      expect(match).not.to.be.null

      expect(match[0]).to.include('plugins/index.js')
    })
  })

  it('merges task events on subsequent registrations and logs warning for conflicts', function () {
    return systemTests.exec(this, {
      project: 'multiple-task-registrations',
      spec: 'multiple_task_registrations.cy.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })
})
