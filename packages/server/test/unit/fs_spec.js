require('../spec_helper')

const fs = require(`${root}lib/util/fs`)

describe('lib/util/fs', () => {
  beforeEach(() => {
    return sinon.spy(console, 'error')
  })

  it('warns when trying to use fs.existsSync', () => {
    fs.existsSync(__filename)
    const warning = 'WARNING: fs sync methods can fail due to EMFILE errors'

    expect(console.error).to.be.calledWith(warning)
  })

  context('fs.pathExists', () => {
    it('finds this file', () => {
      return fs.pathExists(__filename)
      .then((found) => {
        expect(found).to.be.true
      })
    })

    it('does not find non-existent file', () => {
      return fs.pathExists('does-not-exist')
      .then((found) => {
        expect(found).to.be.false
      })
    })
  })
})
