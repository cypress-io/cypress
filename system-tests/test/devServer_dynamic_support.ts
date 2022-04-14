import systemTests from '../lib/system-tests'

describe('devServer dynamic import', function () {
  systemTests.setup()

  it('throws error when devServer use dynamic import instead of require', function () {
    return systemTests.exec(this, {
      project: 'devServer-dynamic-import',
      testingType: 'component',
      expectedExitCode: 1,
      snapshot: true,
    })
  })
})
