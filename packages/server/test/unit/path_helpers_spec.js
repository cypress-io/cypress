// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../spec_helper')

const path_helpers = require(`${root}lib/util/path_helpers`)

describe('lib/util/path_helpers', () => {
  context('checkIfResolveChangedRootFolder', () => {
    const check = path_helpers.checkIfResolveChangedRootFolder

    it('ignores non-absolute paths', () => {
      expect(check('foo/index.js', 'foo')).to.be.false()
    })

    it('handles paths that do not switch', () => {
      expect(check('/foo/index.js', '/foo')).to.be.false()
    })

    it('detects path switch', () => {
      expect(check('/private/foo/index.js', '/foo')).to.be.true()
    })
  })
})
