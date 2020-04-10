require('../../spec-helper')

const snapshot = require('snap-shot-it')
const la = require('lazy-ass')
const os = require('os')

/* eslint-env mocha */
/* global sinon */
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

  context('getUploadeVersionFolder', () => {
    it('returns folder', () => {
      const aws = {
        folder: 'desktop',
      }
      const folder = upload.getUploadeVersionFolder(aws, '3.3.0')

      la(folder === 'desktop/3.3.0', 'wrong desktop folder', folder)
    })
  })

  context('getUploadDirName', () => {
    it('returns folder with platform', () => {
      const aws = {
        folder: 'desktop',
      }

      sinon.stub(upload, 'getAwsObj').returns(aws)
      sinon.stub(os, 'arch').returns('x64')

      const folder = upload.getUploadDirName({
        platform: 'darwin',
        version: '3.3.0',
      })

      la(
        folder === 'desktop/3.3.0/darwin-x64/',
        'wrong upload desktop folder',
        folder,
      )
    })
  })
})
