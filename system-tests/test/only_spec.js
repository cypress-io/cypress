const systemTests = require('../lib/system-tests').default

describe('e2e only spec', () => {
  systemTests.setup()

  it('failing', function () {
    return systemTests.exec(this, {
      spec: 'only*.js',
      snapshot: true,
    })
  })
})
