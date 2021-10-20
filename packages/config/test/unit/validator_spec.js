const validator = require('../../src/index')

describe('src/index', () => {
  describe('.getConfigKeys', () => {
    beforeEach(function () {
      this.includes = (key) => {
        expect(validator.getConfigKeys()).to.include(key)
      }
    })

    it('includes blockHosts', function () {
      return this.includes('blockHosts')
    })
  })
})
