const validator = require('../../src/index')
const { expect } = require('chai')

describe('src/index', () => {
  describe('.getPublicConfigKeys', () => {
    beforeEach(function () {
      this.includes = (key) => {
        expect(validator.getPublicConfigKeys()).to.include(key)
      }
    })

    it('includes blockHosts', function () {
      return this.includes('blockHosts')
    })
  })
})
