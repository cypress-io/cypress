const { sinon } = require('@packages/https-proxy/test/spec_helper')
const { expect } = require('chai')
const hasha = require('hasha')
const fs = require('fs')

const {
  getCDN,
  getUploadDirForPlatform,
  getUploadPath,
  uploadArtifactToS3,
} = require('../../binary/upload-build-artifact')
const upload = require('../../binary/upload')
const uploadUtils = require('../../binary/util/upload')
const { s3helpers } = require('../../binary/s3-api')

/* eslint-env mocha */
describe('upload-release-artifact', () => {
  describe('.getCDN', () => {
    it('returns CDN s3 url', () => {
      const uploadUrl = 'dir/path/file'
      const result = getCDN(uploadUrl)

      expect(result).to.eq('https://cdn.cypress.io/dir/path/file')
    })
  })

  describe('.getUploadDirForPlatform', () => {
    it('returns folder for given version and platform', () => {
      const options = {
        uploadFolder: 'binary',
        platformArch: 'darwin-x64',
        version: '3.3.0',
      }
      const result = getUploadDirForPlatform(options)

      expect(result).to.eq('beta/binary/3.3.0/darwin-x64')
    })
  })

  describe('.getUploadPath', () => {
    it('returns s3 upload path', () => {
      const options = {
        uploadFolder: 'binary',
        platformArch: 'darwin-x64',
        version: '3.3.0',
        hash: 'hash',
        uploadFileName: 'file',
      }
      const result = getUploadPath(options)

      expect(result).to.eq('beta/binary/3.3.0/darwin-x64/hash/file')
    })
  })

  describe('.uploadArtifactToS3', () => {
    let sandbox

    beforeEach(function () {
      sandbox = sinon.sandbox.create()
      sandbox.stub(hasha, 'fromFileSync').returns('checksum')
      sandbox.stub(fs, 'statSync').returns('size')
      sandbox.stub(s3helpers, 'makeS3').returns('size')
      sandbox.stub(s3helpers, 'setUserMetadata')
      sandbox.stub(upload, 'toS3')
      sandbox.stub(uploadUtils, 'formHashFromEnvironment')
      sandbox.stub(uploadUtils, 'getS3Credentials').returns({ bucket: 'beta' })
      sandbox.stub(uploadUtils, 'getUploadNameByOsAndArch')
      sandbox.stub(uploadUtils, 'saveUrl')
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('throws error if type argument is missing', () => {
      expect(() => uploadArtifactToS3()).to.throw(/specify which upload type you'd like to upload/)
    })

    it('throws error if type argument is not binary or npm-package', () => {
      expect(() => uploadArtifactToS3(['--type', 'npm'])).to.throw(/specify which upload type you'd like to upload/)
    })

    it('throws error if version argument is missing', () => {
      expect(() => uploadArtifactToS3(['--type', 'binary'])).to.throw(/invalid version/)
    })

    it('throws error if version argument is not a semver', () => {
      expect(() => uploadArtifactToS3(['--type', 'npm-package', '--version', '.1'])).to.throw(/invalid version/)
    })

    it('throws error if not ran in CircleCI to generate unique hash', () => {
      uploadUtils.formHashFromEnvironment.throws()
      expect(() => uploadArtifactToS3(['--type', 'npm-package', '--version', '1.0.0'])).to.throw()
    })

    it('does not call s3 methods and returns url when --dry-run is passed', async () => {
      uploadUtils.formHashFromEnvironment.returns('hash')
      uploadUtils.getUploadNameByOsAndArch.returns('darwin-x64')

      const binaryArgs = ['--file', 'my.zip', '--type', 'binary', '--version', '1.0.0', '--dry-run', 'true']

      const binaryUrl = await uploadArtifactToS3(binaryArgs)

      expect(uploadUtils.formHashFromEnvironment).to.have.calledOnce
      expect(uploadUtils.getUploadNameByOsAndArch).to.have.calledOnce
      expect(upload.toS3).not.to.have.been.called
      expect(binaryUrl).to.equal('https://cdn.cypress.io/beta/binary/1.0.0/darwin-x64/hash/cypress.zip')

      const packageArgs = ['--file', 'cypress.tgz', '--type', 'npm-package', '--version', '1.0.0', '--dry-run', 'true']

      const packageUrl = await uploadArtifactToS3(packageArgs)

      expect(uploadUtils.formHashFromEnvironment).to.have.calledTwice
      expect(uploadUtils.getUploadNameByOsAndArch).to.have.calledTwice
      expect(upload.toS3).not.to.have.been.called
      expect(packageUrl).to.equal('https://cdn.cypress.io/beta/npm/1.0.0/darwin-x64/hash/cypress.tgz')
    })

    it('uploads binary to s3 and saves url to json', () => {
      uploadUtils.formHashFromEnvironment.returns('hash')
      uploadUtils.getUploadNameByOsAndArch.returns('darwin-x64')
      upload.toS3.resolves(true)

      const args = ['--file', 'my.zip', '--type', 'binary', '--version', '1.0.0']

      uploadArtifactToS3(args)

      expect(uploadUtils.formHashFromEnvironment).to.have.calledOnce
      expect(uploadUtils.getUploadNameByOsAndArch).to.have.calledOnce

      expect(upload.toS3).to.have.been.calledOnce
      expect(upload.toS3.lastCall.args).to.have.lengthOf(1)
      expect(upload.toS3.lastCall.args[0]).to.have.property('file', 'my.zip')
      expect(upload.toS3.lastCall.args[0]).to.have.property('uploadPath', 'beta/binary/1.0.0/darwin-x64/hash/cypress.zip')

      expect(uploadUtils.saveUrl).to.have.calledOnce
      expect(uploadUtils.saveUrl.lastCall.args).to.have.lengthOf(1)
      expect(uploadUtils.saveUrl.lastCall.args[0]).to.eq('binary-url.json')
    })

    it('uploads npm-package to s3 and saves url to json', () => {
      uploadUtils.formHashFromEnvironment.returns('hash')
      uploadUtils.getUploadNameByOsAndArch.returns('darwin-x64')
      upload.toS3.resolves(true)

      const args = ['--file', 'my.zip', '--type', 'npm-package', '--version', '1.0.0']

      uploadArtifactToS3(args)

      expect(uploadUtils.formHashFromEnvironment).to.have.calledOnce
      expect(uploadUtils.getUploadNameByOsAndArch).to.have.calledOnce

      expect(upload.toS3).to.have.been.calledOnce
      expect(upload.toS3.lastCall.args).to.have.lengthOf(1)
      expect(upload.toS3.lastCall.args[0]).to.have.property('file', 'my.zip')
      expect(upload.toS3.lastCall.args[0]).to.have.property('uploadPath', 'beta/npm/1.0.0/darwin-x64/hash/cypress.tgz')

      expect(uploadUtils.saveUrl).to.have.calledOnce
      expect(uploadUtils.saveUrl.lastCall.args).to.have.lengthOf(1)
      expect(uploadUtils.saveUrl.lastCall.args[0]).to.eq('npm-package-url.json')
    })
  })
})
