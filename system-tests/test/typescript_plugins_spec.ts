import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('e2e typescript in plugins file', function () {
  systemTests.setup()

  it('handles tsconfig with module other than commonjs', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('ts-proj-with-module-esnext'),
    })
  })

  // https://github.com/cypress-io/cypress/issues/7575
  it('defaults to esModuleInterop: false', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('ts-proj'),
    })
  })

  // https://github.com/cypress-io/cypress/issues/7575
  it('allows esModuleInterop to be overridden with true via tsconfig.json', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('ts-proj-esmoduleinterop-true'),
    })
  })

  // https://github.com/cypress-io/cypress/issues/8359
  it('loads tsconfig.json from plugins directory', function () {
    return systemTests.exec(this, {
      project: Fixtures.projectPath('ts-proj-tsconfig-in-plugins'),
    })
  })
})
