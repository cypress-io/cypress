require('../spec_helper')

const os = require('os')
const rp = require('@cypress/request-promise')
const pkg = require('@packages/root')
const machineId = require(`${root}lib/util/machine_id`)
const Updater = require(`${root}lib/updater`)

describe('lib/updater', () => {
  context('._getManifest', () => {
    const BASE_URL = 'https://download.cypress.io'

    beforeEach(function () {
      nock.cleanAll()

      nock.enableNetConnect()
    })

    it('sends the right headers', () => {
      sinon.stub(os, 'platform').returns('win32')
      sinon.stub(os, 'arch').returns('x32')

      nock(BASE_URL)
      .matchHeader('x-cypress-version', pkg.version)
      .matchHeader('x-os-name', 'win32')
      .matchHeader('x-arch', 'x32')
      .matchHeader('x-machine-id', 'machine-id')
      .matchHeader('x-initial-launch', 'true')
      .matchHeader('x-testing-type', 'type')
      .get('/desktop.json')
      .reply(200, {
        version: '1000.0.0',
      })

      return Updater
      ._getManifest({ testingType: 'type', initialLaunch: true, id: 'machine-id' })
      .then((resp) => {
        expect(resp.version).to.eq('1000.0.0')
      })
    })
  })

  context('.check', () => {
    const version = pkg.version

    beforeEach(() => {
      pkg.version = '5.0.0'
      sinon.stub(machineId, 'machineId').resolves('machine-id')
    })

    afterEach(() => {
      pkg.version = version
    })

    it('calls onNewVersion when local version is lower than manifest\'s version', async () => {
      sinon.stub(rp, 'get').resolves({ version: '5.1.0' })
      const onNewVersion = sinon.spy()

      await Updater.check({ onNewVersion })

      expect(onNewVersion).to.be.calledWithMatch({ version: '5.1.0' })
    })

    it('calls onNoNewVersion when local version is same as the manifest\'s version', async () => {
      sinon.stub(rp, 'get').resolves({ version: '5.0.0' })
      const onNoNewVersion = sinon.spy()

      await Updater.check({ onNoNewVersion })

      expect(onNoNewVersion).to.be.calledWithMatch()
    })

    it('calls onNoNewVersion when manifest is invalid', async () => {
      sinon.stub(rp, 'get').resolves({})
      const onNoNewVersion = sinon.spy()

      await Updater.check({ onNoNewVersion })

      expect(onNoNewVersion).to.be.calledWithMatch()
    })

    it('calls onNoNewVersion when fetching the manifest throws an error', async () => {
      sinon.stub(rp, 'get').rejects(new Error())
      const onNoNewVersion = sinon.spy()

      await Updater.check({ onNoNewVersion })

      expect(onNoNewVersion).to.be.calledWithMatch()
    })
  })
})
