const snapshot = require('snap-shot-it')

/* eslint-env mocha */
describe('upload-unique-binary', () => {
  describe('getUploadDirName', () => {
    const { getUploadDirName } = require('../../binary/upload-unique-binary')

    it('returns folder for given version', () => {
      const options = {
        platformArch: 'darwin-x64',
        version: '3.3.0',
        // ci name + commit sha + build number
        hash: 'ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123',
      }

      snapshot('upload binary folder', {
        input: options,
        result: getUploadDirName(options),
      })
    })
  })

  describe('getUploadDirForPlatform', () => {
    const {
      getUploadDirForPlatform,
    } = require('../../binary/upload-unique-binary')

    it('returns folder for given version and platform', () => {
      const options = {
        platformArch: 'darwin-x64',
        version: '3.3.0',
      }
      const result = getUploadDirForPlatform(options, options.platformArch)

      snapshot('upload binary folder for platform', {
        input: options,
        result,
      })
    })
  })

  describe('getCDN', () => {
    context('binary', () => {
      const { getCDN } = require('../../binary/upload-unique-binary')

      it('returns CDN s3 path', () => {
        const options = {
          platform: 'darwin-x64',
          filename: 'cypress.zip',
          version: '3.3.0',
          // ci name + commit sha + build number
          hash: 'ci-name-e154a40f3f76abd39a1d85c0ebc0ff9565015706-123',
        }

        snapshot('getCDN for binary', {
          input: options,
          result: getCDN(options),
        })
      })
    })
  })
})
