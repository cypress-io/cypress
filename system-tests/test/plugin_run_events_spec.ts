import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('e2e plugin run events', () => {
  systemTests.setup()

  systemTests.it('sends events', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-run-events'),
    spec: '*',
    snapshot: true,
    config: {
      video: false,
    },
  })

  systemTests.it('handles video being deleted in after:spec', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-after-spec-deletes-video'),
    spec: '*',
    snapshot: true,
  })

  systemTests.it('fails run if event handler throws', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-run-event-throws'),
    spec: '*',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      video: false,
    },
  })
})
