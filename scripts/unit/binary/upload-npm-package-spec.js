const snapshot = require('snap-shot-it')

/* eslint-env mocha */
// TODO: merge tests for new file name
describe.skip('getCDN', () => {
  context('npm package', () => {
    const { getCDN } = require('../../binary/upload-build-artifact')

    it('returns CDN s3 path', () => {
      const options = {
        platform: 'darwin-x64',
        filename: 'cypress.tgz',
        version: '3.3.0',
        // ci name + commit sha + build number
        hash: 'ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123',
      }

      snapshot({
        input: options,
        result: getCDN(options),
      })
    })
  })
})
