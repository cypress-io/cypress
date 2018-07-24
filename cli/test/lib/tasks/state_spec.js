require('../../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const proxyquire = require('proxyquire')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)
const state = require(`${lib}/tasks/state`)

const cacheDir = path.join('.cache/Cypress')
const versionDir = path.join(cacheDir, '1.2.3')
const binaryDir = path.join(versionDir, 'Cypress.app')
const binaryPkgPath = path.join(binaryDir, 'Contents', 'Resources', 'app', 'package.json')

describe('lib/tasks/state', function () {
  beforeEach(function () {
    sinon.stub(util, 'getCacheDir').returns(cacheDir)
    logger.reset()
    sinon.stub(process, 'exit')
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    os.platform.returns('darwin')
  })

  context('.getBinaryPkgVersionAsync', function () {

    it('resolves version from version file when it exists', function () {
      sinon.stub(fs, 'pathExistsAsync').withArgs(binaryPkgPath).resolves(true)
      sinon.stub(fs, 'readJsonAsync').withArgs(binaryPkgPath).resolves({ version: '2.0.48' })
      return state.getBinaryPkgVersionAsync(binaryDir)
      .then((binaryVersion) => {
        expect(binaryVersion).to.equal('2.0.48')
      })
    })

    it('returns null if no version found', function () {
      sinon.stub(fs, 'pathExistsAsync').resolves(false)
      return state.getBinaryPkgVersionAsync(binaryDir)
      .then((binaryVersion) => expect(binaryVersion).to.equal(null))
    })

    it('returns correct version if passed binaryDir', function () {
      const customBinaryDir = '/custom/binary/dir'
      const customBinaryPackageDir = '/custom/binary/dir/Contents/Resources/app/package.json'
      sinon.stub(fs, 'pathExistsAsync').withArgs(customBinaryPackageDir).resolves(true)
      sinon.stub(fs, 'readJsonAsync').withArgs(customBinaryPackageDir).resolves({ version: '3.4.5' })

      return state.getBinaryPkgVersionAsync(customBinaryDir)
      .then((binaryVersion) => expect(binaryVersion).to.equal('3.4.5'))
    })

  })

  context('.getPathToExecutable', function () {
    it('resolves path on macOS', function () {
      const macExecutable = '.cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'
      expect(state.getPathToExecutable(state.getBinaryDir())).to.equal(macExecutable)
    })
    it('resolves path on linux', function () {
      os.platform.returns('linux')
      const linuxExecutable = '.cache/Cypress/1.2.3/Cypress/Cypress'
      expect(state.getPathToExecutable(state.getBinaryDir())).to.equal(linuxExecutable)
    })
    it('resolves path on windows', function () {
      os.platform.returns('win32')
      expect(state.getPathToExecutable(state.getBinaryDir())).to.endWith('.exe')
    })
    it('resolves from custom binaryDir', function () {
      const customBinaryDir = 'home/downloads/cypress.app'
      expect(state.getPathToExecutable(customBinaryDir)).to.equal('home/downloads/cypress.app/Contents/MacOS/Cypress')
    })
  })

  context('.getBinaryDir', function () {
    it('resolves path on macOS', function () {
      expect(state.getBinaryDir()).to.equal(path.join(versionDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      os.platform.returns('linux')
      expect(state.getBinaryDir()).to.equal(path.join(versionDir, 'Cypress'))
    })

    it('resolves path on windows', function () {
      const state = proxyquire(`${lib}/tasks/state`, { path: path.win32 })
      os.platform.returns('win32')
      const pathToExec = state.getBinaryDir()
      expect(pathToExec).to.be.equal(path.win32.join(versionDir, 'Cypress'))
    })

    it('resolves path to binary/installation directory', function () {
      expect(state.getBinaryDir()).to.equal(binaryDir)
    })

    it('resolves path to binary/installation from version', function () {
      expect(state.getBinaryDir('4.5.6')).to.be.equal(path.join(cacheDir, '4.5.6', 'Cypress.app'))
    })

    it('rejects on anything else', function () {
      os.platform.returns('unknown')
      expect(() => state.getBinaryDir().to.throw('Platform: "unknown" is not supported.')
      )
    })
  })

  context('.getBinaryVerifiedAsync', function () {
    it('resolves true if verified', function () {
      sinon.stub(fs, 'readJsonAsync').resolves({ verified: true })
      return state.getBinaryVerifiedAsync('/asdf')
      .then((isVerified) => expect(isVerified).to.be.equal(true))
    })
    it('resolves undefined if not verified', function () {
      sinon.stub(fs, 'readJsonAsync').rejects({ code: 'ENOENT' })
      return state.getBinaryVerifiedAsync('/asdf')
      .then((isVerified) => expect(isVerified).to.be.equal(undefined))
    })
    it('can accept custom binaryDir', function () {
      const customBinaryDir = '/custom/binary/dir'
      sinon.stub(fs, 'pathExistsAsync').withArgs('/custom/binary/dir/binary_state.json').resolves({ verified: true })
      sinon.stub(fs, 'readJsonAsync').withArgs('/custom/binary/dir/binary_state.json').resolves({ verified: true })
      return state.getBinaryVerifiedAsync(customBinaryDir)
      .then((isVerified) => expect(isVerified).to.be.equal(true))
    })
  })
  context('.writeBinaryVerified', function () {
    it('writes to binary state verified:true', function () {
      sinon.stub(fs, 'outputJsonAsync').resolves()
      return state.writeBinaryVerifiedAsync(true, binaryDir)
      .then(() => expect(fs.outputJsonAsync).to.be.calledWith(
        path.join(binaryDir, 'binary_state.json'), { verified: true }), { spaces: 2 }
      )
    })

    it('write to binary state verified:false', function () {
      sinon.stub(fs, 'outputJsonAsync').resolves()
      return state.writeBinaryVerifiedAsync(false, binaryDir)
      .then(() => expect(fs.outputJsonAsync).to.be.calledWith(
        path.join(binaryDir, 'binary_state.json'), { verified: false }, { spaces: 2 })
      )
    })
  })
  context('.getCacheDir', function () {

    it('uses cachedir()', function () {
      const ret = state.getCacheDir()
      expect(ret).to.equal(cacheDir)
    })

    it('uses env variable CYPRESS_CACHE_FOLDER', function () {
      process.env.CYPRESS_CACHE_FOLDER = '/path/to/dir'
      const ret = state.getCacheDir()
      expect(ret).to.equal('/path/to/dir')
    })

    it('CYPRESS_CACHE_FOLDER resolves from relative path', () => {
      process.env.CYPRESS_CACHE_FOLDER = './local-cache/folder'
      const ret = state.getCacheDir()
      expect(ret).to.eql(path.resolve('local-cache/folder'))
    })
  })
  context('.parseRealPlatformBinaryFolderAsync', function () {
    beforeEach(function () {
      sinon.stub(fs, 'realpathAsync').callsFake((path) => Promise.resolve(path))
    })

    it('can parse on darwin', function () {
      os.platform.returns('darwin')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress.app/Contents/MacOS/Cypress').then((path) => expect(path).to.eql('/Documents/Cypress.app'))
    })
    it('can parse on linux', function () {
      os.platform.returns('linux')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress').then((path) => expect(path).to.eql('/Documents/Cypress'))
    })
    it('can parse on darwin', function () {
      os.platform.returns('win32')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe').then((path) => expect(path).to.eql('/Documents/Cypress'))
    })
    it('throws when invalid on darwin', function () {
      os.platform.returns('darwin')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe').then((path) => expect(path).to.eql(false))
    })
    it('throws when invalid on linux', function () {
      os.platform.returns('linux')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe').then((path) => expect(path).to.eql(false))
    })
    it('throws when invalid on windows', function () {
      os.platform.returns('win32')
      return state.parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress').then((path) => expect(path).to.eql(false))
    })
  })
})
