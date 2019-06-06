const la = require('lazy-ass')

/* eslint-env mocha */
describe('s3-api', () => {
  context('hasOnlyStringValues', () => {
    const { hasOnlyStringValues } = require('../../binary/s3-api')

    it('returns true if object has only string values', () => {
      const o = {
        foo: 'bar',
        baz: 'baz',
      }

      la(hasOnlyStringValues(o))
    })

    it('returns false if object has non-string value', () => {
      const o = {
        foo: 'bar',
        baz: 42,
      }

      la(!hasOnlyStringValues(o))
    })
  })
})
