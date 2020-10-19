const { expect } = require('../spec_helper')

const EE = require('events')
const Server = require('../../lib/server')

describe('lib/server', () => {
  beforeEach(function () {
    this.setup = (options = {}) => {
      this.ca = {}
      this.port = 12345

      return Server.create(this.ca, this.port, options)
    }
  })

  afterEach(() => {
    delete process.env.HTTPS_PROXY

    delete process.env.NO_PROXY
  })

  context('#listen', () => {
    it('calls options.onUpgrade with req, socket head', function () {
      const onUpgrade = this.sandbox.stub()

      return this.setup({ onUpgrade })
      .then((srv) => {
        srv._sniServer.emit('upgrade', 1, 2, 3)

        expect(onUpgrade).to.be.calledWith(1, 2, 3)
      })
    })

    it('calls options.onRequest with req, res', function () {
      const onRequest = this.sandbox.stub()
      const req = { url: 'https://www.foobar.com', headers: { host: 'www.foobar.com' } }
      const res = {}

      return this.setup({ onRequest })
      .then((srv) => {
        srv._sniServer.emit('request', req, res)

        expect(onRequest).to.be.calledWith(req, res)
      })
    })

    it('calls options.onError with err and port and destroys the client socket', function (done) {
      const socket = new EE()

      socket.destroy = this.sandbox.stub()
      const head = {}

      const onError = function (err, socket2, head2, port) {
        expect(err.message).to.eq('connect ECONNREFUSED 127.0.0.1:8444')

        expect(socket).to.eq(socket2)
        expect(head).to.eq(head2)
        expect(port).to.eq('8444')

        expect(socket.destroy).to.be.calledOnce

        done()
      }

      this.setup({ onError })
      .then((srv) => {
        srv._makeConnection(socket, head, '8444', 'localhost')
      })
    })

    // https://github.com/cypress-io/cypress/issues/3250
    it('does not crash when an erroneous URL is provided, just destroys socket', function (done) {
      const socket = new EE()

      socket.destroy = this.sandbox.stub()
      const head = {}

      const onError = function (err, socket2, head2, port) {
        expect(err.message).to.eq('getaddrinfo ENOTFOUND %7Balgolia_application_id%7D-dsn.algolia.net')

        expect(socket).to.eq(socket2)
        expect(head).to.eq(head2)
        expect(port).to.eq('443')

        expect(socket.destroy).to.be.calledOnce

        done()
      }

      this.setup({ onError })
      .then((srv) => {
        srv._makeConnection(socket, head, '443', '%7Balgolia_application_id%7D-dsn.algolia.net')
      })
    })
  })
})
