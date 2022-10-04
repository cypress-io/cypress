import systemTests from '../lib/system-tests'

describe('e2e plugin run events', () => {
  systemTests.setup()

  systemTests.it('sends events', {
    browser: 'electron',
    project: 'plugin-run-events',
    spec: '*',
    snapshot: true,
    config: {
      video: false,
    },
  })

  systemTests.it('handles video being deleted in after:spec', {
    browser: 'electron',
    project: 'plugin-after-spec-deletes-video',
    spec: '*',
    snapshot: true,
  })

  systemTests.it('fails run if event handler throws', {
    browser: 'electron',
    project: 'plugin-run-event-throws',
    spec: '*',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      video: false,
    },
    onStdout: (stdout) => {
      // TODO: Figure out how to fix the race condition on thrown exceptions in before:spec that causes additional electron exceptions to fire: https://github.com/cypress-io/cypress/issues/24102
      return stdout.trimRight()
    },
  })
})
