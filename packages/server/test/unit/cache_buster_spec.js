// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../spec_helper')

const CacheBuster = require(`${root}lib/util/cache_buster`)

describe('lib/cache_buster', () => {
  context('#get', () => {
    it('returns seperator + 3 characters', () => {
      expect(CacheBuster.get().length).to.eq(4)
    })
  })

  context('#strip', () => {
    it('strips cache buster', () => {
      const rand = CacheBuster.get()
      const file = `foo.js${rand}`

      expect(CacheBuster.strip(file)).to.eq('foo.js')
    })

    it('is noop without cache buster', () => {
      const file = 'foo.js'

      expect(CacheBuster.strip(file)).to.eq('foo.js')
    })
  })
})
