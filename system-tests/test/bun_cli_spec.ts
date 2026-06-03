import systemTests from '../lib/system-tests'
import { bunFixtureHttpServer, shouldSkipBunSystemTests } from './bun_support'

describe('bun CLI commands', () => {
  systemTests.setup({
    servers: bunFixtureHttpServer('bun-with-deps'),
  })

  const skip = shouldSkipBunSystemTests()

  systemTests.it('can run cypress version with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress version',
    skip,
  })

  systemTests.it('can run cypress run with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress run',
    skip,
  })

  systemTests.it('can install cypress binary with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress install',
    // Avoid CDN download in dev/CI: monorepo dev version has no matching hosted binary.
    processEnv: { CYPRESS_INSTALL_BINARY: '0' },
    skip,
  })

  systemTests.it('can verify cypress installation with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress verify',
    skip,
  })
})
