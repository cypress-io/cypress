import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e plugin run events', () => {
  e2e.setup()

  e2e.it('sends server events', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-run-events'),
    spec: '*',
    snapshot: true,
    config: {
      video: false,
    },
  })

  e2e.it('fails if experimentalRunEvents is not enabled', {
    browser: 'electron',
    project: Fixtures.projectPath('plugin-run-events'),
    spec: '*',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalRunEvents: false,
      video: false,
    },
  })

  e2e.it('fails run if server event handler throws', {
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
