import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('retries', () => {
  e2e.setup()

  e2e.it('supports retries', {
    project: Fixtures.projectPath('retries-2'),
    spec: 'fail-twice.js',
    snapshot: true,
  })

  e2e.it.only('warns about retries plugin', {
    project: Fixtures.projectPath('plugin-retries'),
    spec: 'main.spec.js',
    stubPackage: 'cypress-plugin-retries',
    snapshot: true,
  })
})
