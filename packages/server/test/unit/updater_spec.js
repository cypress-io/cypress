require('../spec_helper')

const machineId = require(`${root}lib/util/machine_id`)
const rp = require('@cypress/request-promise')
const Updater = require(`${root}lib/updater`)
const pkg = require('@packages/root')

describe('lib/updater', () => {
  context('_getManifest', () => {
    it('sends the right headers', () => {
      sinon.stub(rp, 'get').resolves({})

      Updater._getManifest('machine-id')

      expect(rp.get).to.be.calledWithMatch({
        headers: {
          'x-cypress-version': pkg.version,
          'x-machine-id': 'machine-id',
        },
      })
    })
  })

  context('check', () => {
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
