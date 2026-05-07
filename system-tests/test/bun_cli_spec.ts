import systemTests from '../lib/system-tests'
import { shouldSkipBunSystemTests } from './bun_support'

describe('bun CLI commands', () => {
  systemTests.setup()
  const skip = shouldSkipBunSystemTests()

  systemTests.it('can run cypress open with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress open',
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
