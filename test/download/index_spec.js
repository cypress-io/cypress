require('../spec_helper')

const download = require('../../lib/download/download')
const index = require('../../lib/download/index')
const utils = require('../../lib/download/utils')

const packageVersion = require('../../package').version

describe('index', function () {
  context('#install', function () {
    beforeEach(function () {
      this.sandbox.stub(utils, 'log')
      this.sandbox.stub(download, 'start').resolves()
      this.sandbox.stub(utils, 'getInstalledVersion').resolves()
    })

    describe('when version is already installed', function () {
      beforeEach(function () {
        utils.getInstalledVersion.resolves(packageVersion)
        return index.install()
      })

      it('logs message', function () {
        expect(utils.log.lastCall.args[0]).to.include(`Cypress ${packageVersion} already installed.`)
      })

      it('does not download', function () {
        expect(download.start).not.to.be.called
      })
    })

    describe('when getting installed version fails', function () {
      beforeEach(function () {
        utils.getInstalledVersion.rejects(new Error('no'))
        return index.install()
      })

      it('logs message', function () {
        expect(utils.log.lastCall.args[0]).to.equal('Cypress was not found.')
        expect(utils.log.lastCall.args[1]).to.include(`Installing Cypress (version: ${packageVersion}).`)
      })

      it('downloads', function () {
        expect(download.start).to.be.calledWith({
          displayOpen: false,
          cypressVersion: packageVersion,
          version: packageVersion,
        })
      })
    })

    describe('when getting installed version does not match package version', function () {
      beforeEach(function () {
        utils.getInstalledVersion.resolves('x.x.x')
        return index.install()
      })

      it('logs message', function () {
        expect(utils.log.lastCall.args[0]).to.equal(`Installed version (x.x.x) does not match package version (${packageVersion}).`)
        expect(utils.log.lastCall.args[1]).to.include(`Installing Cypress (version: ${packageVersion}).`)
      })

      it('downloads', function () {
        expect(download.start).to.be.calledWith({
          displayOpen: false,
          cypressVersion: packageVersion,
          version: packageVersion,
        })
      })
    })
  })
})
