require('../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

const packageVersion = require('../../package').version
const utils = require('../../lib/download/utils')

const distDir = path.join(__dirname, '../../lib/download/dist')

describe('utils', function () {
  beforeEach(function () {
    this.ensureEmptyInstallationDir = () => {
      return fs.removeAsync(distDir).then(() => {
        return utils.ensureInstallationDir()
      })
    }
  })

  context('#ensureInstallationDir', function () {
    beforeEach(function () {
      return fs.removeAsync(distDir)
    })

    it('ensures directory exists', function () {
      return utils.ensureInstallationDir().then(() => {
        return fs.statAsync(distDir)
      })
    })
  })

  context('#getInstallationDir', function () {
    it('resolves path to installation directory', function () {
      expect(utils.getInstallationDir()).to.equal(distDir)
    })
  })

  context('#getInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('resolves version from version file when it exists', function () {
      return utils.writeInstalledVersion('2.0.48')
      .then(() => {
        return utils.getInstalledVersion()
      })
      .then((version) => {
        expect(version).to.equal('2.0.48')
      })
    })

    it('throws when version file does not exist', function () {
      return utils.getInstalledVersion()
      .catch(() => {})
    })
  })

  context('#getPathToUserExecutable', function () {
    it('resolves path on macOS', function () {
      this.sandbox.stub(os, 'platform').returns('darwin')
      expect(utils.getPathToUserExecutable()).to.equal(path.join(distDir, 'Cypress.app'))
    })

    it('resolves path on linux', function () {
      this.sandbox.stub(os, 'platform').returns('linux')
      expect(utils.getPathToUserExecutable()).to.equal(path.join(distDir, 'Cypress'))
    })

    it('rejects on anything else', function () {
      this.sandbox.stub(os, 'platform').returns('win32')
      expect(() => utils.getPathToUserExecutable()).to.throw(`Platform: 'win32' is not supported.`)
    })
  })

  context('#log', function () {
    beforeEach(function () {
      this.console = this.sandbox.spy(console, 'log')
    })

    it('logs the messages surrounded by newlines', function () {
      utils.log('Foo', 'bar', 'baz')
      expect(this.console.getCall(0).args[0]).to.equal('')
      expect(this.console.getCall(1).args[0]).to.equal('Foo')
      expect(this.console.getCall(1).args[1]).to.equal('bar')
      expect(this.console.getCall(1).args[2]).to.equal('baz')
      expect(this.console.getCall(2).args[0]).to.equal('')
    })
  })

  context('#writeInstalledVersion', function () {
    beforeEach(function () {
      return this.ensureEmptyInstallationDir()
    })

    it('writes the version to the version file', function () {
      return utils.writeInstalledVersion('84.0.2')
      .then(() => {
        return fs.readFileAsync(path.join(distDir, 'version'), 'utf8')
      })
      .then((version) => {
        expect(version).to.equal('84.0.2')
      })
    })
  })

  context('#verify', function () {
    beforeEach(function () {
      this.log = this.sandbox.spy(console, 'log')
      this.sandbox.stub(process, 'exit')
      return this.ensureEmptyInstallationDir()
    })

    it('logs that it is verifying', function () {
      return utils.verify().then(() => {
        expect(this.log).to.be.calledWith('Verifying Cypress executable...')
      })
    })

    it('logs error and exits when no version of Cypress is installed', function () {
      return utils.verify().then(() => {
        expect(this.log).to.be.calledWith('No version of Cypress executable installed. Run `cypress install` and then try again.')
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs error and exits when installed version does not match package version', function () {
      return utils.writeInstalledVersion('bloop')
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith(`Installed version (bloop) does not match package version (${packageVersion}). Run \`cypress install\` and then try again.`)
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('logs error and exits when executable cannot be found', function () {
      return utils.writeInstalledVersion(packageVersion)
      .then(() => {
        return utils.verify()
      })
      .then(() => {
        expect(this.log).to.be.calledWith('Cypress executable not found. Run `cypress install` and then try again.')
        expect(process.exit).to.be.calledWith(1)
      })
    })
  })
})
