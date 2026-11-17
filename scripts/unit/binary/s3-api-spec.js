const la = require('lazy-ass')

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

  context('s3helpers.listS3Objects', () => {
    const { s3helpers } = require('../../binary/s3-api')

    const s3Returning = (result) => {
      return {
        listObjectsV2 (params, cb) {
          setImmediate(() => cb(null, result))
        },
      }
    }

    it('lists the sub-folders under the upload dir', async () => {
      const list = await s3helpers.listS3Objects('beta/binary/15.21.2/darwin-x64', 'bucket', s3Returning({
        CommonPrefixes: [{ Prefix: 'beta/binary/15.21.2/darwin-x64/v15-abc/' }],
      }))

      la(list.length === 1 && list[0] === 'beta/binary/15.21.2/darwin-x64/v15-abc/', list)
    })

    it('resolves an empty list when nothing was uploaded under the upload dir', async () => {
      const list = await s3helpers.listS3Objects('beta/binary/15.21.2/win32-x64', 'bucket', s3Returning({}))

      la(Array.isArray(list) && list.length === 0, list)
    })
  })
})
