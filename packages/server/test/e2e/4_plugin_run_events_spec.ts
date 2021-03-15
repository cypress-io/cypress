import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e plugin run events', () => {
  e2e.setup()

  e2e.it('sends events', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-run-events'),
    spec: '*',
    snapshot: true,
    config: {
      video: false,
    },
  })

  e2e.it('handles video being deleted in after:spec', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-after-spec-deletes-video'),
    spec: '*',
    snapshot: true,
  })

  e2e.it('fails run if event handler throws', {
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
