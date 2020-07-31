import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e typescript in plugins file', function () {
  e2e.setup()

  it('handles tsconfig with module other than commonjs', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('ts-proj-with-module-esnext'),
    })
  })
})
