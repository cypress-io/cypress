const systemTests = require('../lib/system-tests').default

// While these tests are fairly simple and could be normal cypress tests,
// they also depend on 3rd party libraries used only for the test that we
// don't want to add to cypress' dependencies. They are therefore e2e tests,
// which can have their own package.json.
describe('selectFile', () => {
  systemTests.setup()

  it('works with 3rd party libraries', function () {
    return systemTests.exec(this, {
      project: 'selectFile',
      snapshot: false,
      expectedExitCode: 0,
    })
  })
})
