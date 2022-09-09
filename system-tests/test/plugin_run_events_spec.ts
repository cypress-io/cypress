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

  // TODO: Skipping for now. Will readdress with: https://github.com/cypress-io/cypress/issues/22983
  systemTests.it.skip('fails run if event handler throws', {
    browser: 'electron',
    project: 'plugin-run-event-throws',
    spec: '*',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      video: false,
    },
  })
})
