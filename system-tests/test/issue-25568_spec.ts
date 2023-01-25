import systemTests from '../lib/system-tests'

// We had an issue that only occurred when:
// - CT testing
// - browser=electron
// - more than 1 spec file
// - experimentalSingleTabMode=false
//
// The electron browser would not exit after all the tests finished.
describe('component testing issue 25568', function () {
  systemTests.setup()

  it(`executes all component tests and exits properly`, function () {
    return systemTests.exec(this, {
      project: 'vite-simple',
      testingType: 'component',
      browser: 'electron',
    })
  })
})
