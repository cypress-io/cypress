require('../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))

const utils = require('../../lib/download/utils')

const distDir = path.join(__dirname, '../../lib/download/dist')

describe('utils', function () {
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
      return fs.removeAsync(distDir).then(() => {
        return utils.ensureInstallationDir()
      })
    })

    it('resolves version from version file when it exists', function () {
      return fs.writeFileAsync(path.join(distDir, 'version'), '2.0.48')
      .then(() => {
        return utils.getInstalledVersion()
      })
      .then((version) => {
        expect(version).to.equal('2.0.48')
      })
    })

    it('resolves null when version file does not exists', function () {
      return utils.getInstalledVersion()
      .then((version) => {
        expect(version).to.be.null
      })
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
      return fs.removeAsync(distDir).then(() => {
        return utils.ensureInstallationDir()
      })
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
})
