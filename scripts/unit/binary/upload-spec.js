const snapshot = require('snap-shot-it')

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
})
