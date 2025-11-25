import systemTests from '../lib/system-tests'

describe('bun CLI commands', () => {
  systemTests.setup()

  systemTests.it('can run cypress open with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress open',
  })

  systemTests.it('can run cypress run with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress run',
  })

  systemTests.it('can install cypress binary with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress install',
  })

  systemTests.it('can verify cypress installation with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    command: 'bun run cypress verify',
  })
})
