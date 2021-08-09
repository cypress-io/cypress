import Chai from 'chai'
import Bluebird from 'bluebird'
import http from 'http'
import sinon from 'sinon'
import { Express } from 'express'

import { Cfg } from '../../lib/project-base'
import { ServerBase, WarningErr } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import SinonChai from 'sinon-chai'
const expect = Chai.expect

Chai.use(SinonChai)

class ServerTest extends ServerBase<SocketE2E> {
  createServer (
    app: Express,
    config: Cfg,
    onWarning: unknown,
  ): Bluebird<[number, WarningErr?]> {
    return Bluebird.try(() => {
      return [1111]
    })
  }
}

describe('ServerBase', () => {
  it('smoke test', () => {
    new ServerTest()
  })

  describe('#createExpressApp', () => {
    beforeEach(() => {
      sinon.restore()
    })

    it('removes x-powered-by header', (done) => {
      const server = new ServerTest()

      const app = server.createExpressApp({ morgan: true })

      app.get('/test', (req, res) => res.end('OK'))

      const srv = app.listen(3344, () => {
        http.request('http://localhost:3344/test,', (res) => {
          expect(res.headers['x-powered-by']).to.be.undefined
          srv.close(done)
        }).end()
      })
    })

    it('does not use morgan when morgan: false', () => {
      const useMorgan = sinon.stub(ServerTest.prototype, 'useMorgan').returns(() => {})
      const server = new ServerTest()

      server.createExpressApp({ morgan: false })

      expect(useMorgan).not.to.have.been.called
    })

    it('does use morgan when morgan: true', () => {
      const useMorgan = sinon.stub(ServerTest.prototype, 'useMorgan').returns(() => {})
      const server = new ServerTest()

      server.createExpressApp({ morgan: true })

      expect(useMorgan).to.have.been.called
    })

    it('uses middleware if provided', (done) => {
      const server = new ServerTest()
      const middleware = sinon.stub()

      server.__setMiddleware(middleware)
      server.createExpressApp({})

      const app = server.createExpressApp({})

      app.get('/test', (req, res) => res.end('OK'))

      const srv = app.listen(3344, () => {
        http.request('http://localhost:3344/test,', (res) => {
          expect(middleware).to.have.been.called
          srv.close(done)
        }).end()
      })
    })
  })
})
