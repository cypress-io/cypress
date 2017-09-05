require('../../spec_helper')

const os = require('os')
const path = require('path')

const fs = require(`${lib}/fs`)
const logger = require(`${lib}/logger`)
const info = require(`${lib}/tasks/info`)

const installationDir = info.getInstallationDir()
const infoFilePath = info.getInfoFilePath()

describe('info', function () {
  beforeEach(function () {
    logger.reset()

    this.sandbox.stub(process, 'exit')
    this.ensureEmptyInstallationDir = () => {
      return fs.removeAsync(installationDir)
      .then(() => {
        return info.ensureInstallationDir()
      })
    }
  })

  afterEach(function () {
    return fs.removeAsync(installationDir)
  })

  context('.clearVersionState', function () {
    it('wipes out version info in info.json', function () {
      return fs.outputJsonAsync(infoFilePath, { version: '5', verifiedVersion: '5', other: 'info' })
      .then(() => {
        return info.clearVersionState()
      })
      .then(() => {
        return fs.readJsonAsync(infoFilePath)
      })
      .then((contents) => {
        expect(contents).to.eql({ other: 'info' })
      })
    })
  })

  context('.ensureInstallationDir', function () {
    beforeEach(function () {
      return fs.removeAsync(installationDir)
    })

    it('ensures directory exists', function () {
      return info.ensureInstallationDir().then(() => {
        return fs.statAsync(installationDir)
      })
    })
  })

  context('.getInstallationDir', function () {
    it('resolves path to installation directory', function () {
      expect(info.getInstallationDir()).to.equal(installationDir)
    })
  })

  context('.getInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('resolves version from version file when it exists', function () {
      return info.writeInstalledVersion('2.0.48')
      .then(() => {
        return info.getInstalledVersion()
      })
      .then((version) => {
        expect(version).to.equal('2.0.48')
      })
    })

    it('throws when version file does not exist', function () {
      return info.getInstalledVersion()
      .catch(() => {})
    })
  })

  context('.getPathToUserExecutableDir', function () {
    it('resolves path on macOS', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      expect(info.getPathToUserExecutableDir()).to.equal(path.join(installationDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      this.sandbox.stub(os, 'platform').returns('linux')
      expect(info.getPathToUserExecutableDir()).to.equal(path.join(installationDir, 'Cypress'))
    })

    it('rejects on anything else', function () {
      this.sandbox.stub(os, 'platform').returns('win32')
      expect(() => info.getPathToUserExecutableDir()).to.throw('Platform: "win32" is not supported.')
    })
  })

  context('.writeInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('writes the version to the version file', function () {
      return info.writeInstalledVersion('the version')
      .then(() => {
        return fs.readJsonAsync(infoFilePath).get('version')
      })
      .then((version) => {
        expect(version).to.equal('the version')
      })
    })
  })
})
