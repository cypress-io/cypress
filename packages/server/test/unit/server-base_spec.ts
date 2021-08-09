import Chai from 'chai'
import Bluebird from 'bluebird'
import http from 'http'
import sinon from 'sinon'
import { Express } from 'express'

import { Cfg } from '../../lib/project-base'
import { ServerBase, WarningErr } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import SinonChai from 'sinon-chai'
import { SpecsStore } from '../../lib/specs-store'
const expect = Chai.expect

Chai.use(SinonChai)

const browser = {
  name: 'chrome',
  family: 'chromium',
  displayName: 'chrome',
  path: '/usr/chrome.app',
  channel: 'canary',
  version: '90',
  majorVersion: null,
  isHeaded: true,
  isHeadless: false,
} as const

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

  describe('#open', () => {
    beforeEach(() => {
      sinon.restore()
    })

    const cfg = { projectRoot: '/foo/bar' }
    const noop = (...args: any[]) => ({} as any)
    const defaults = {
      getSpec: noop,
      getCurrentBrowser: () => browser,
      onError: noop,
      onWarning: noop,
      shouldCorrelatePreRequests: () => false,
      specsStore: new SpecsStore({}, 'e2e'),
      createRoutes: () => {},
      testingType: 'e2e',
      SocketCtor: SocketE2E,
    } as const

    it('smoke test', async () => {
      const server = new ServerTest()

      await server.open(cfg, defaults)
    })

    it('errors when using component testing without config.baseUrl', () => {
      const server = new ServerTest()

      try {
        server.open({ ...cfg, baseUrl: undefined }, { ...defaults, testingType: 'component' })
      } catch (e) {
        expect(e.message).to.eq('ServerCt#open called without config.baseUrl.')
      }
    })

    it('assigns socket', async () => {
      const server = new ServerTest()

      await server.open(cfg, defaults)
      expect(server.socket).not.to.be.undefined
    })

    it('calls createNetworkProxy, assigns `_networkProxy`', async () => {
      const server = new ServerTest()

      await server.open(cfg, defaults)
      expect(server.networkProxy).not.to.be.undefined
    })

    it('calls createHosts with config.hosts', async () => {
      const hosts = ['/host']
      const createHostsStub = sinon.stub(ServerTest.prototype, 'createHosts')
      const server = new ServerTest()

      await server.open({ ...cfg, hosts }, defaults)

      expect(createHostsStub).to.have.been.calledWith(hosts)
    })

    it('calls createRoutes with correct params', async () => {
      const server = new ServerTest()
      const createRoutesStub = sinon.stub()

      await server.open(cfg, { ...defaults, createRoutes: createRoutesStub })
      expect(createRoutesStub).to.have.been.calledWithMatch({
        config: cfg,
        specsStore: defaults.specsStore,
        onError: defaults.onError,
        getSpec: defaults.getSpec,
        getCurrentBrowser: defaults.getCurrentBrowser,
      })

      const args = createRoutesStub.getCalls()[0].args[0]

      expect(args.networkProxy).to.eq(server.networkProxy)
      expect(args.nodeProxy).to.eq(server.nodeProxy)
      expect(args.app).not.to.be.undefined
    })
  })
})
