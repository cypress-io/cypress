require('../spec_helper')

const path_helpers = require(`${root}lib/util/path_helpers`)

describe('lib/util/path_helpers', () => {
  context('checkIfResolveChangedRootFolder', () => {
    const check = path_helpers.checkIfResolveChangedRootFolder

    it('ignores non-absolute paths', () => {
      expect(check('foo/index.js', 'foo')).to.be.false
    })

    it('handles paths that do not switch', () => {
      expect(check('/foo/index.js', '/foo')).to.be.false
    })

    it('detects path switch', () => {
      expect(check('/private/foo/index.js', '/foo')).to.be.true
    })
  })
})
