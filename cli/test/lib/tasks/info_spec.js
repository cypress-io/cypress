require('../../spec_helper')

const os = require('os')
const path = require('path')
const cachedir = require('cachedir')
const proxyquire = require('proxyquire')
// const Promise = require('bluebird')

const state = require(`${lib}/tasks/state`)
const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)

const cacheDir = path.join(cachedir('Cypress'))
const binaryDir = path.join(cacheDir, '1.2.3')
const binaryPkgPath = path.join(binaryDir, 'Cypress.app', 'Contents', 'Resources', 'app', 'package.json')

describe('lib/tasks/state', function () {
  beforeEach(function () {
    logger.reset()
    this.sandbox.stub(process, 'exit')
    this.sandbox.stub(util, 'pkgVersion').returns('1.2.3')
  })

  context('.getBinaryDir', function () {
    it('resolves path to binary/installation directory', function () {
      expect(state.getBinaryDir()).to.equal(binaryDir)
    })
    it('resolves path to binary/installation from version', function () {
      expect(state.getBinaryDir('4.5.6')).to.be.equal(path.join(cacheDir, '4.5.6'))
    })
  })

  context('.getBinaryPkgVersionAsync', function () {

    it('resolves version from version file when it exists', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      this.sandbox.stub(fs, 'pathExistsAsync').withArgs(binaryPkgPath).resolves(true)
      this.sandbox.stub(fs, 'readJsonAsync').withArgs(binaryPkgPath).resolves({ version: '2.0.48' })
      return state.getBinaryPkgVersionAsync()
      .then((binaryVersion) => {
        expect(binaryVersion).to.equal('2.0.48')
      })
    })

    it('returns null if no version found', function () {
      this.sandbox.stub(fs, 'pathExistsAsync').resolves(false)
      return state.getBinaryPkgVersionAsync()
      .then((binaryVersion) => expect(binaryVersion).to.equal(null))
    })

  })

  context('.getPathToExecutable', function () {
    it('resolves path on windows', function () {
      this.sandbox.stub(os, 'platform').returns('win32')
      expect(state.getPathToExecutable()).to.endWith('.exe')
    })
  })

  context('.getPathToUserExecutableDir', function () {
    it('resolves path on macOS', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      expect(state.getPathToExecutableDir()).to.equal(path.join(binaryDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      this.sandbox.stub(os, 'platform').returns('linux')
      expect(state.getPathToExecutableDir()).to.equal(path.join(binaryDir, 'Cypress'))
    })

    it('resolves path on windows', function () {
      const state = proxyquire(`${lib}/tasks/state`, { path: path.win32 })
      this.sandbox.stub(os, 'platform').returns('win32')
      const pathToExec = state.getPathToExecutableDir(binaryDir)
      expect(pathToExec).to.be.equal(path.win32.join(binaryDir, 'Cypress'))
    })

    it('rejects on anything else', function () {
      this.sandbox.stub(os, 'platform').returns('unknown')
      expect(() => state.getPathToExecutableDir()).to.throw('Platform: "unknown" is not supported.')
    })
  })

  context('.getBinaryVerifiedAsync', function () {
    it('resolves true if verified', function () {
      this.sandbox.stub(fs, 'readJsonAsync').resolves({ verified: true })
      return state.getBinaryVerifiedAsync()
      .then((isVerified) => expect(isVerified).to.be.equal(true))
    })
    it('resolves undefined if not verified', function () {
      this.sandbox.stub(fs, 'readJsonAsync').rejects({ code: 'ENOENT' })
      return state.getBinaryVerifiedAsync()
      .then((isVerified) => expect(isVerified).to.be.equal(undefined))
    })
  })
  context('.writeBinaryVerified', function () {
    it('writes to binary state verified:true', function () {
      this.sandbox.stub(fs, 'outputJsonAsync').resolves()
      return state.writeBinaryVerifiedAsync(true)
      .then(() => expect(fs.outputJsonAsync).to.be.calledWith(
        path.join(binaryDir, 'binary_state.json'), { verified: true }), { spaces: 2 }
      )
    })

    it('write to binary state verified:false', function () {
      this.sandbox.stub(fs, 'outputJsonAsync').resolves()
      return state.writeBinaryVerifiedAsync(false)
      .then(() => expect(fs.outputJsonAsync).to.be.calledWith(
        path.join(binaryDir, 'binary_state.json'), { verified: false }, { spaces: 2 })
      )
    })
  })
  context('.getCacheDir', function () {
    afterEach(() => {
      delete process.env.CYPRESS_CACHE_DIRECTORY
    })
    it('uses cachedir()', function () {
      const ret = state.getCacheDir()
      expect(ret).to.equal(cacheDir)
    })

    it('uses env variable CYPRESS_CACHE_DIRECTORY', function () {
      process.env.CYPRESS_CACHE_DIRECTORY = '/path/to/dir'
      const ret = state.getCacheDir()
      expect(ret).to.equal('/path/to/dir')
    })
  })
})
