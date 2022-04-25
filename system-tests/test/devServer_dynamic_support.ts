import systemTests from '../lib/system-tests'

describe('devServer incorrect configuration', function () {
  systemTests.setup()

  it('throws error when devServer is missing required configuration', function () {
    return systemTests.exec(this, {
      project: 'devServer-dynamic-import',
      testingType: 'component',
      expectedExitCode: 1,
      snapshot: true,
    })
  })
})
