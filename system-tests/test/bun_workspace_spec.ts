import systemTests from '../lib/system-tests'
import { bunFixtureHttpServer, shouldSkipBunSystemTests } from './bun_support'

describe('bun workspace support', () => {
  systemTests.setup({
    servers: bunFixtureHttpServer('bun-workspace'),
  })

  const skip = shouldSkipBunSystemTests()

  systemTests.it('can handle bun workspace dependencies', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-workspace',
    skip,
  })

  systemTests.it('can install workspace dependencies with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-workspace',
    command: 'bun install',
    skip,
  })
})
