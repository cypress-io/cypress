const e2e = require('../support/helpers/e2e').default

describe('e2e only spec', () => {
  e2e.setup()

  it('failing', function () {
    return e2e.exec(this, {
      spec: 'only*.coffee',
      snapshot: true,
    })
  })
})
