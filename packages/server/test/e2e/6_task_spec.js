// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e2e = require('../support/helpers/e2e').default

const Fixtures = require('../support/helpers/fixtures')

describe('e2e task', () => {
  e2e.setup()

  it('handles undefined return and includes stack trace in error', function () {
    return e2e.exec(this, {
      spec: 'task_spec.coffee',
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
    return e2e.exec(this, {
      project: Fixtures.projectPath('multiple-task-registrations'),
      spec: 'multiple_task_registrations_spec.coffee',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })
})
