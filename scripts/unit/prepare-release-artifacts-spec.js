const shelljs = require('shelljs')

describe('prepare-release-artifacts', () => {
  it('runs expected commands', { timeout: 10_000 }, () => {
    const stdout = shelljs.exec('yarn prepare-release-artifacts --dry-run --sha 57d0a85108fad6f77b39db88b8a7d8a3bfdb51a2 --version 1.2.3')

    snapshot(stdout)
  })
})
