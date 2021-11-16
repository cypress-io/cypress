const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

// While these tests are fairly simple and could be normal cypress tests,
// they also depend on 3rd party libraries used only for the test that we
// don't want to add to cypress' dependencies. They are therefore e2e tests,
// which can have their own package.json.
describe('attachFile', () => {
  systemTests.setup()

  it('works with 3rd party libraries', function () {
    const project = Fixtures.projectPath('attachFile')

    return systemTests.exec(this, {
      project,
      snapshot: false,
      expectedExitCode: 0,
    })
  })
})
