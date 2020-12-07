require('../../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const proxyquire = require('proxyquire')
const mockfs = require('mock-fs')
const { expect } = require('chai')
const debug = require('debug')('test')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const util = require(`${lib}/util`)
const state = require(`${lib}/tasks/state`)

const cacheDir = path.join('.cache/Cypress')
const versionDir = path.join(cacheDir, '1.2.3')
const binaryDir = path.join(versionDir, 'Cypress.app')
const binaryPkgPath = path.join(
  binaryDir,
  'Contents',
  'Resources',
  'app',
  'package.json',
)

describe('lib/tasks/state', function () {
  beforeEach(function () {
    sinon.stub(util, 'getCacheDir').returns(cacheDir)
    logger.reset()
    sinon.stub(process, 'exit')
    sinon.stub(util, 'pkgVersion').returns('1.2.3')
    os.platform.returns('darwin')
  })

  context('.getBinaryPkgVersion', function () {
    it('returns version if present', () => {
      expect(state.getBinaryPkgVersion({ version: '1.2.3' })).to.equal('1.2.3')
    })

    it('returns null if passed null', () => {
      expect(state.getBinaryPkgVersion(null)).to.equal(null)
    })
  })

  context('.getBinaryPkgAsync', function () {
    it('resolves with loaded file when the file exists', function () {
      sinon
      .stub(fs, 'pathExistsAsync')
      .withArgs(binaryPkgPath)
      .resolves(true)

      sinon
      .stub(fs, 'readJsonAsync')
      .withArgs(binaryPkgPath)
      .resolves({ version: '2.0.48' })

      return state.getBinaryPkgAsync(binaryDir).then((result) => {
        expect(result).to.deep.equal({ version: '2.0.48' })
      })
    })

    it('returns null if no version found', function () {
      sinon.stub(fs, 'pathExistsAsync').resolves(false)

      return state
      .getBinaryPkgAsync(binaryDir)
      .then((result) => {
        return expect(result).to.equal(null)
      })
    })

    it('returns correct version if passed binaryDir', function () {
      const customBinaryDir = '/custom/binary/dir'
      const customBinaryPackageDir =
        '/custom/binary/dir/Contents/Resources/app/package.json'

      sinon
      .stub(fs, 'pathExistsAsync')
      .withArgs(customBinaryPackageDir)
      .resolves(true)

      sinon
      .stub(fs, 'readJsonAsync')
      .withArgs(customBinaryPackageDir)
      .resolves({ version: '3.4.5' })

      return state
      .getBinaryPkgAsync(customBinaryDir)
      .then((result) => {
        return expect(result).to.deep.equal({ version: '3.4.5' })
      })
    })
  })

  context('.getPathToExecutable', function () {
    it('resolves path on macOS', function () {
      const macExecutable =
        '.cache/Cypress/1.2.3/Cypress.app/Contents/MacOS/Cypress'

      expect(state.getPathToExecutable(state.getBinaryDir())).to.equal(
        macExecutable,
      )
    })

    it('resolves path on linux', function () {
      os.platform.returns('linux')
      const linuxExecutable = '.cache/Cypress/1.2.3/Cypress/Cypress'

      expect(state.getPathToExecutable(state.getBinaryDir())).to.equal(
        linuxExecutable,
      )
    })

    it('resolves path on windows', function () {
      os.platform.returns('win32')
      expect(state.getPathToExecutable(state.getBinaryDir())).to.endWith('.exe')
    })

    it('resolves from custom binaryDir', function () {
      const customBinaryDir = 'home/downloads/cypress.app'

      expect(state.getPathToExecutable(customBinaryDir)).to.equal(
        'home/downloads/cypress.app/Contents/MacOS/Cypress',
      )
    })
  })

  context('.getBinaryDir', function () {
    it('resolves path on macOS', function () {
      expect(state.getBinaryDir()).to.equal(
        path.join(versionDir, 'Cypress.app'),
      )
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
      expect(state.getBinaryDir('4.5.6')).to.be.equal(
        path.join(cacheDir, '4.5.6', 'Cypress.app'),
      )
    })

    it('rejects on anything else', function () {
      os.platform.returns('unknown')
      expect(() => {
        return state.getBinaryDir().to.throw('Platform: "unknown" is not supported.')
      })
    })
  })

  context('.getBinaryVerifiedAsync', function () {
    it('resolves true if verified', function () {
      sinon.stub(fs, 'readJsonAsync').resolves({ verified: true })

      return state
      .getBinaryVerifiedAsync('/asdf')
      .then((isVerified) => {
        return expect(isVerified).to.be.equal(true)
      })
    })

    it('resolves undefined if not verified', function () {
      const err = new Error()

      err.code = 'ENOENT'
      sinon.stub(fs, 'readJsonAsync').rejects(err)

      return state
      .getBinaryVerifiedAsync('/asdf')
      .then((isVerified) => {
        return expect(isVerified).to.be.equal(undefined)
      })
    })

    it('can accept custom binaryDir', function () {
      // note how the binary state file is in the runner's parent folder
      const customBinaryDir = '/custom/binary/1.2.3/runner'
      const binaryStatePath = '/custom/binary/1.2.3/binary_state.json'

      sinon
      .stub(fs, 'pathExistsAsync')
      .withArgs(binaryStatePath)
      .resolves(true)

      sinon
      .stub(fs, 'readJsonAsync')
      .withArgs(binaryStatePath)
      .resolves({ verified: true })

      return state
      .getBinaryVerifiedAsync(customBinaryDir)
      .then((isVerified) => {
        return expect(isVerified).to.be.equal(true)
      })
    })
  })

  context('.writeBinaryVerified', function () {
    const binaryStateFilename = path.join(versionDir, 'binary_state.json')

    beforeEach(() => {
      mockfs({})
    })

    afterEach(() => {
      mockfs.restore()
    })

    it('writes to binary state verified:true', function () {
      sinon.stub(fs, 'outputJsonAsync').resolves()

      return state
      .writeBinaryVerifiedAsync(true, binaryDir)
      .then(
        () => {
          return expect(fs.outputJsonAsync).to.be.calledWith(
            binaryStateFilename,
            { verified: true },
          )
        },
        { spaces: 2 },
      )
    })

    it('write to binary state verified:false', function () {
      sinon.stub(fs, 'outputJsonAsync').resolves()

      return state
      .writeBinaryVerifiedAsync(false, binaryDir)
      .then(() => {
        return expect(fs.outputJsonAsync).to.be.calledWith(
          binaryStateFilename,
          { verified: false },
          { spaces: 2 },
        )
      })
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

    it('CYPRESS_CACHE_FOLDER resolves from relative path during postinstall', () => {
      process.env.CYPRESS_CACHE_FOLDER = './local-cache/folder'
      // simulates current folder when running "npm postinstall" hook
      sinon.stub(process, 'cwd').returns('/my/project/folder/node_modules/cypress')
      const ret = state.getCacheDir()

      debug('returned cache dir %s', ret)
      expect(ret).to.eql(path.resolve('/my/project/folder/local-cache/folder'))
    })

    it('CYPRESS_CACHE_FOLDER resolves from absolute path during postinstall', () => {
      process.env.CYPRESS_CACHE_FOLDER = '/cache/folder/Cypress'
      // simulates current folder when running "npm postinstall" hook
      sinon.stub(process, 'cwd').returns('/my/project/folder/node_modules/cypress')
      const ret = state.getCacheDir()

      debug('returned cache dir %s', ret)
      expect(ret).to.eql(path.resolve('/cache/folder/Cypress'))
    })

    it('resolves ~ with user home folder', () => {
      const homeDir = os.homedir()

      process.env.CYPRESS_CACHE_FOLDER = '~/.cache/Cypress'

      const ret = state.getCacheDir()

      debug('cache dir is "%s"', ret)
      expect(path.isAbsolute(ret), ret).to.be.true
      expect(ret, '~ has been resolved').to.not.contain('~')
      expect(ret, 'replaced ~ with home directory').to.equal(`${homeDir}/.cache/Cypress`)
    })
  })

  context('.parseRealPlatformBinaryFolderAsync', function () {
    beforeEach(function () {
      sinon.stub(fs, 'realpathAsync').callsFake((path) => {
        return Promise.resolve(path)
      })
    })

    it('can parse on darwin', function () {
      os.platform.returns('darwin')

      return state
      .parseRealPlatformBinaryFolderAsync(
        '/Documents/Cypress.app/Contents/MacOS/Cypress',
      )
      .then((path) => {
        return expect(path).to.eql('/Documents/Cypress.app')
      })
    })

    it('can parse on linux', function () {
      os.platform.returns('linux')

      return state
      .parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress')
      .then((path) => {
        return expect(path).to.eql('/Documents/Cypress')
      })
    })

    it('can parse on darwin', function () {
      os.platform.returns('win32')

      return state
      .parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')
      .then((path) => {
        return expect(path).to.eql('/Documents/Cypress')
      })
    })

    it('throws when invalid on darwin', function () {
      os.platform.returns('darwin')

      return state
      .parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')
      .then((path) => {
        return expect(path).to.eql(false)
      })
    })

    it('throws when invalid on linux', function () {
      os.platform.returns('linux')

      return state
      .parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress.exe')
      .then((path) => {
        return expect(path).to.eql(false)
      })
    })

    it('throws when invalid on windows', function () {
      os.platform.returns('win32')

      return state
      .parseRealPlatformBinaryFolderAsync('/Documents/Cypress/Cypress')
      .then((path) => {
        return expect(path).to.eql(false)
      })
    })
  })
})
