require('../spec_helper')
require(`${root}lib/cwd`)

const nmi = require('node-machine-id')
const request = require('@cypress/request')
const Updater = require(`${root}lib/updater`)
const pkg = require('@packages/root')
const _ = require('lodash')

describe('lib/updater', () => {
  context('interface', () => {
    it('returns an updater instance', () => {
      const u = new Updater({})

      expect(u).to.be.instanceof(Updater)
    })
  })

  context('#getPackage', () => {
    beforeEach(function () {
      pkg.foo = 'bar'
      this.updater = new Updater({})
    })

    afterEach(() => {
      return delete pkg.foo
    })

    it('inserts manifestUrl to package.json', function () {
      const expected = _.extend({}, pkg, {
        foo: 'bar',
        manifestUrl: 'https://download.cypress.io/desktop.json',
      })

      expect(this.updater.getPackage()).to.deep.eq(expected)
    })
  })

  context('#getClient', () => {
    it('sets .client to new Updater', () => {
      const u = new Updater({})

      u.getClient()

      expect(u.client).to.have.property('checkNewVersion')
    })

    it('returns .client if exists', () => {
      const u = new Updater({})
      const client = u.getClient()
      const client2 = u.getClient()

      expect(client).to.eq(client2)
    })
  })

  context('#checkNewVersion', () => {
    beforeEach(function () {
      this.get = sinon.spy(request, 'get')

      this.updater = new Updater({})
    })

    it('sends x-cypress-version', function (done) {
      this.updater.getClient().checkNewVersion(() => {
        expect(this.get).to.be.calledWithMatch({
          headers: {
            'x-cypress-version': pkg.version,
          },
        })

        return done()
      })
    })

    it('sends x-machine-id', function (done) {
      nmi.machineId()
      .then((id) => {
        return this.updater.getClient().checkNewVersion(() => {
          expect(this.get).to.be.calledWithMatch({
            headers: {
              'x-machine-id': id,
            },
          })

          return done()
        })
      })
    })

    it('sends x-machine-id as null on error', function (done) {
      sinon.stub(nmi, 'machineId').rejects(new Error())

      this.updater.getClient().checkNewVersion(() => {
        expect(this.get).to.be.calledWithMatch({
          headers: {
            'x-machine-id': null,
          },
        })

        return done()
      })
    })
  })

  context('#check', () => {
    beforeEach(function () {
      this.updater = new Updater({ quit: sinon.spy() })
      this.updater.getClient()

      return sinon.stub(this.updater.client, 'checkNewVersion')
    })

    it('calls checkNewVersion', function () {
      this.updater.check()

      expect(this.updater.client.checkNewVersion).to.be.called
    })

    it('calls options.newVersionExists when there is a no version', function () {
      this.updater.client.checkNewVersion.yields(null, true, {})

      const options = { onNewVersion: sinon.spy() }

      this.updater.check(options)

      expect(options.onNewVersion).to.be.calledWith({})
    })

    it('calls options.newVersionExists when there is a no version', function () {
      this.updater.client.checkNewVersion.yields(null, false)

      const options = { onNoNewVersion: sinon.spy() }

      this.updater.check(options)

      expect(options.onNoNewVersion).to.be.called
    })
  })
})
