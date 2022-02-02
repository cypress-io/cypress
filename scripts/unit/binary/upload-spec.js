require('../../spec-helper')

const snapshot = require('snap-shot-it')
const la = require('lazy-ass')

/* eslint-env mocha */
describe('upload', () => {
  const upload = require('../../binary/upload')

  context('getRemoteManifest', () => {
    it('returns object with download urls for each platform', () => {
      const folder = 'desktop'
      const version = '3.3.0'
      const manifest = upload.getRemoteManifest(folder, version)

      snapshot('test runner manifest', manifest)
    })
  })

  context('getUploadVersionFolder', () => {
    it('returns folder', () => {
      const aws = {
        folder: 'desktop',
      }
      const folder = upload.getUploadVersionFolder(aws, '3.3.0')

      la(folder === 'desktop/3.3.0', 'wrong desktop folder', folder)
    })
  })
})
