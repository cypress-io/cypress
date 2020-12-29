import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e downloads', () => {
  e2e.setup()

  e2e.it('handles various file downloads', {
    browser: 'electron',
    project: Fixtures.projectPath('downloads'),
    spec: '*',
    // snapshot: true,
    config: {
      video: false,
    },
  })
})
