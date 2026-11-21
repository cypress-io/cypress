import ws from 'ws'
import HttpsProxyAgent from 'https-proxy-agent'
import evilDns from 'evil-dns'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// NOTE: we need to import the client from the lib directory because the browser/client directory is compiled to ESM.
// we are unable to import ESM into a CommonJS test context, even if we await import() the module.
import * as socketIo from '@packages/socket/lib/client'
import * as httpsServer from '@packages/https-proxy/test/helpers/https_server'
import Fixtures from '@tooling/system-tests'
import * as config from '../../lib/config'
import { ServerBase } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import { Automation } from '../../lib/automation'
import { createRoutes } from '../../lib/routes'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import { GracefulExit } from '../../lib/util/graceful-exit'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean }

testGlobals.IS_TEST = true

const cyPort = 12345
const otherPort = 55551
const wsPort = 20000
const wssPort = 8443

const originalEnv = { ...process.env }

let ctx

describe('Web Sockets', () => {
  let idsPath: string
  let cfg: any
  let wsServer: any
  let wss: any
  let server: any

  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    process.env = { ...originalEnv }
  })

  beforeEach(async () => {
    ctx = getCtx()
    Fixtures.scaffold()

    idsPath = Fixtures.projectPath('ids')

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(idsPath)

    cfg = await ctx.lifecycleManager.getFullInitialConfig({ port: cyPort })

    wsServer = new ws.Server({ port: wsPort })

    server = new ServerBase(cfg)

    await server.open(cfg, {
      SocketCtor: SocketE2E,
      createRoutes,
      testingType: 'e2e',
      getCurrentBrowser: () => null,
    })

    const automationStub = {
      use: () => { },
    }

    // these upgrades reach this server acting as a proxy, like a proxied
    // browser — which only happens on the MITM path, and the server refuses
    // CONNECT until a launch resolves it
    await server.setNetworkMode(false)

    await server.startWebsockets(automationStub, config, {})

    const httpsSrv = await httpsServer.start(wssPort)

    wss = new ws.Server({ server: httpsSrv })
  })

  afterEach(() => {
    Fixtures.remove()

    evilDns.clear()

    wsServer.close()
    wss.close()

    return Promise.all([
      server.close(),
      httpsServer.stop(),
    ])
  })

  describe('proxying external websocket requests', () => {
    it('sends back ECONNRESET when error upgrading', async () => {
      const agent = new HttpsProxyAgent(`http://localhost:${cyPort}`)

      server.remoteStates.set(`http://localhost:${otherPort}`)

      const client = new ws(`ws://localhost:${otherPort}`, {
        agent,
      })

      const err: any = await new Promise((resolve) => {
        client.on('error', resolve)
      })

      expect(err.code).toBe('ECONNRESET')
      expect(err.message).toBe('socket hang up')
    })

    it('proxies https messages', async () => {
      const agent = new HttpsProxyAgent(`http://localhost:${cyPort}`, {
      })

      wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://localhost:${wssPort}`, {
        rejectUnauthorized: false,
        agent,
      })

      const data = await new Promise((resolve) => {
        client.on('message', resolve)

        client.on('open', () => {
          return client.send('foo')
        })
      })

      expect(data).toBe('response:foo')
    })

    it('proxies http messages through http proxy', async () => {
      // force node into legit proxy mode like a browser
      const agent = new HttpsProxyAgent(`http://localhost:${cyPort}`)

      server.remoteStates.set(`http://localhost:${wsPort}`)

      wsServer.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`ws://localhost:${wsPort}`, {
        agent,
      })

      const data = await new Promise((resolve) => {
        client.on('message', resolve)

        client.on('open', () => {
          return client.send('foo')
        })
      })

      expect(data).toBe('response:foo')
    })

    it('proxies https messages through http', async () => {
      // force node into legit proxy mode like a browser
      const agent = new HttpsProxyAgent({
        host: 'localhost',
        port: cyPort,
        rejectUnauthorized: false,
      })

      server.remoteStates.set(`https://localhost:${wssPort}`)

      wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://localhost:${wssPort}`, {
        agent,
      })

      const data = await new Promise((resolve) => {
        client.on('message', resolve)

        client.on('open', () => {
          return client.send('foo')
        })
      })

      expect(data).toBe('response:foo')
    })

    it('proxies through subdomain by using host header', async () => {
      // we specifically only allow remote connections
      // to ws.foobar.com since that is where the websocket
      // server is mounted and this tests that we make
      // a connection to the right host instead of the
      // origin (which isnt ws.foobar.com)
      nock.enableNetConnect('ws.foobar.com')

      evilDns.add('ws.foobar.com', '127.0.0.1')

      // force node into legit proxy mode like a browser
      const agent = new HttpsProxyAgent({
        host: 'localhost',
        port: cyPort,
        rejectUnauthorized: false,
      })

      server.remoteStates.set(`https://foobar.com:${wssPort}`)

      wss.on('connection', (c) => {
        return c.on('message', (msg) => {
          return c.send(`response:${msg}`)
        })
      })

      const client = new ws(`wss://ws.foobar.com:${wssPort}`, {
        agent,
      })

      const data = await new Promise((resolve) => {
        client.on('message', resolve)

        client.on('open', () => {
          return client.send('foo')
        })
      })

      expect(data).toBe('response:foo')
    })
  })

  describe('socket.io handling', () => {
    let automation: any
    let wsClient: any

    beforeEach(() => {
      automation = new Automation({
        cyNamespace: cfg.namespace,
        cookieNamespace: cfg.socketIoCookie,
        screenshotsFolder: cfg.screenshotsFolder,
      })

      return server.startWebsockets(automation, cfg, {})
    })

    const testSocketIo = function (wsUrl?: string, beforeFn?: () => void) {
      describe('behind Cy proxy', () => {
        beforeEach(async () => {
          // force node into legit proxy mode like a browser
          const agent = new HttpsProxyAgent(`http://localhost:${cyPort}`)

          if (beforeFn != null) {
            beforeFn()
          }

          wsClient = socketIo.client(wsUrl || cfg.proxyUrl, {
            agent,
            path: cfg.socketIoRoute,
            transports: ['websocket'],
            rejectUnauthorized: false,
            extraHeaders: { origin: new URL(wsUrl || cfg.proxyUrl).origin },
          })

          await new Promise<void>((resolve) => {
            wsClient.on('connect', () => {
              return resolve()
            })
          })
        })

        afterEach(() => {
          return wsClient.disconnect()
        })

        it('continues to handle socket.io requests just fine', async () => {
          const data: any = await new Promise((resolve) => {
            wsClient.emit('backend:request', 'get:fixture', 'example.json', {}, resolve)
          })

          expect(data.response).toStrictEqual({ foo: 'bar' })
        })
      })

      describe('without Cy proxy', () => {
        beforeEach(() => {
          return (beforeFn != null ? beforeFn() : undefined)
        })

        afterEach(() => {
          return wsClient.disconnect()
        })

        it('fails to connect via websocket', async () => {
          wsClient = socketIo.client(wsUrl || cfg.proxyUrl, {
            path: cfg.socketIoRoute,
            transports: ['websocket'],
            rejectUnauthorized: false,
            reconnection: false,
          })

          await new Promise<void>((resolve, reject) => {
            wsClient.on('connect', () => {
              return reject(new Error('should not have been able to connect'))
            })

            wsClient.io.on('error', () => {
              return resolve()
            })
          })
        })

        it('fails to connect via polling', async () => {
          wsClient = socketIo.client(wsUrl || cfg.proxyUrl, {
            path: cfg.socketIoRoute,
            transports: ['polling'],
            rejectUnauthorized: false,
            reconnection: false,
          })

          await new Promise<void>((resolve, reject) => {
            wsClient.on('connect', () => {
              return reject(new Error('should not have been able to connect'))
            })

            wsClient.io.on('error', () => {
              return resolve()
            })
          })
        })
      })
    }

    describe('http', () => {
      testSocketIo()
    })

    describe('when http superDomain has been set', () => {
      testSocketIo(`http://localhost:${otherPort}`, () => {
        return server.remoteStates.set(`http://localhost:${otherPort}`)
      })
    })

    describe('when https superDomain has been set', () => {
      testSocketIo(`http://localhost:${wssPort}`, () => {
        return server.remoteStates.set(`http://localhost:${wssPort}`)
      })
    })
  })

  describe('graphql-ws handling on __socket-graphql', () => {
    beforeEach(() => {
      const automation = new Automation({
        cyNamespace: cfg.namespace,
        cookieNamespace: cfg.socketIoCookie,
        screenshotsFolder: cfg.screenshotsFolder,
      })

      return server.startWebsockets(automation, cfg, {})
    })

    const openGraphqlWs = (origin?: string): Promise<{ opened: boolean, statusCode?: number }> => {
      const agent = new HttpsProxyAgent(`http://localhost:${cyPort}`)
      const headers: Record<string, string> = {}

      if (origin !== undefined) {
        headers.Origin = origin
      }

      return new Promise((resolve) => {
        const client = new ws(`ws://localhost:${cyPort}/__socket-graphql`, 'graphql-transport-ws', {
          agent,
          headers,
        })
        let opened = false
        let statusCode
        let done = false

        const finish = () => {
          if (done) return

          done = true
          resolve({ opened, statusCode })
        }

        client.once('open', () => {
          opened = true
          client.close()
        })

        client.once('unexpected-response', (_req, res) => {
          statusCode = res.statusCode
          client.terminate()
          finish()
        })

        client.once('close', () => finish())
        client.once('error', () => {})
      })
    }

    it('accepts upgrade when Origin is the primary origin on a port other than the cypress server port', async () => {
      server.remoteStates.set(`http://localhost:${otherPort}`)

      const result = await openGraphqlWs(`http://localhost:${otherPort}`)

      expect(result.opened, `expected upgrade to succeed; got statusCode=${result.statusCode}`).toBe(true)
    })

    it('refuses upgrade when Origin is not the primary origin', async () => {
      server.remoteStates.set(`http://localhost:${otherPort}`)

      const result = await openGraphqlWs('http://foobar.com:4455')

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(400)
    })

    it('refuses upgrade with no Origin header', async () => {
      const result = await openGraphqlWs(undefined)

      expect(result.opened).toBe(false)
      expect(result.statusCode).toBe(400)
    })
  })
})
