import systemTests from '../lib/system-tests'

describe('bun workspace support', () => {
  systemTests.setup()

  systemTests.it('can handle bun workspace dependencies', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-workspace',
  })

  systemTests.it('can install workspace dependencies with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-workspace',
    command: 'bun install',
  })
})
