import { connect } from '@packages/network'
import { setupFullConfigWithDefaults } from '@packages/config'
import type { DataContext } from '@packages/data-context'
import { clearCtx, setCtx } from '@packages/data-context'
import Bluebird from 'bluebird'
import _ from 'lodash'
import nock from 'nock'
import type { Address } from 'net'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cache } from '../../lib/cache'
import * as ensureUrl from '../../lib/util/ensure-url'
import * as fileServer from '../../lib/file_server'
import { ServerBase } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import type { SocketAllowed } from '../../lib/util/socket_allowed'

const morganStubs = vi.hoisted(() => {
  const morganFn = function () {}
  const morganModule = function () {
    return morganFn
  }

  return { morganFn, morganModule }
})

vi.mock('morgan', () => morganStubs.morganModule)

/** Avoid duplicate `graphql` realm when Vitest loads `server-base` → `makeGraphQLServer` (see routes.spec.ts). */
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphqlWS: vi.fn(),
    graphQLHTTP: vi.fn(),
  }
})

/** Same role as `getCtx().file.getFilesByGlob` in legacy `spec_helper` tests — avoids full `makeDataContext`. */
const stubGetFilesByGlob = vi.fn().mockResolvedValue([])

/** Enough for `createCommonRoutes` during `server.open` (see `routes.spec.ts` / studio cy-prompt branches). */
function serverBaseTestCtx (): DataContext {
  return {
    coreData: {},
    lifecycleManager: {
      mainProcessWillDisconnect: vi.fn().mockResolvedValue(undefined),
    },
    destroy: vi.fn().mockResolvedValue(undefined),
    _reset: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataContext
}

function getOpenOptions (overrides: Record<string, unknown> = {}) {
  return {
    SocketCtor: SocketE2E,
    testingType: 'e2e' as const,
    onError: vi.fn(),
    onWarning: vi.fn(),
    getCurrentBrowser: () => null,
    getSpec: () => null,
    shouldCorrelatePreRequests: () => false,
    ...overrides,
  }
}

describe('lib/server-base', () => {
  let config: Awaited<ReturnType<typeof setupFullConfigWithDefaults>>
  let server: ServerBase<SocketE2E>
  let fileServerMock: { close: () => void, port: () => number }
  let oldFileServer: typeof server._fileServer
  let createSpy: ReturnType<typeof vi.spyOn<typeof fileServer, 'create'>>

  beforeEach(async () => {
    await clearCtx()
    setCtx(serverBaseTestCtx())

    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    await cache.remove()
    fileServerMock = {
      close () {},
      port () {
        return 1111
      },
    }

    createSpy = vi.spyOn(fileServer, 'create').mockResolvedValue(fileServerMock as Awaited<ReturnType<typeof fileServer.create>>)

    config = await setupFullConfigWithDefaults({ projectRoot: '/foo/bar/', config: { supportFile: false } }, stubGetFilesByGlob)
    server = new ServerBase(config)

    oldFileServer = server._fileServer
    server._fileServer = fileServerMock
  })

  afterEach(async () => {
    if (server) {
      await server.close()
    }

    vi.restoreAllMocks()
    nock.cleanAll()
    nock.enableNetConnect()
    await clearCtx()
  })

  describe('#createExpressApp', () => {
    let useSpy: ReturnType<typeof vi.spyOn<typeof express.application, 'use'>>

    beforeEach(() => {
      useSpy = vi.spyOn(express.application, 'use')
    })

    afterEach(() => {
      useSpy?.mockRestore()
    })

    it('instantiates express instance without morgan', () => {
      const app = server.createExpressApp({ morgan: false })

      expect(app.get('view engine')).toBe('html')

      expect(useSpy).not.toHaveBeenCalledWith(morganStubs.morganFn)
    })

    it('requires morgan if true', () => {
      const useMorganStub = vi.spyOn(server, 'useMorgan').mockReturnValue(morganStubs.morganFn)

      server.createExpressApp({ morgan: true })

      expect(useMorganStub).toHaveBeenCalledTimes(1)
    })
  })

  describe('#open', () => {
    beforeEach(() => {
      vi.spyOn(server, 'createServer').mockResolvedValue(undefined as never)
    })

    it('calls #createExpressApp with morgan', async () => {
      const createExpressAppSpy = vi.spyOn(server, 'createExpressApp')

      _.extend(config, { port: 54321, morgan: false })

      await server.open(config, getOpenOptions())

      expect(createExpressAppSpy).toHaveBeenCalledWith(expect.objectContaining({ morgan: false }))
    })

    it('calls #createServer with app and config', async () => {
      _.extend(config, { port: 54321 })
      const app = { use: vi.fn() }

      vi.spyOn(server, 'createExpressApp').mockReturnValue(app as never)

      await server.open(config, getOpenOptions())

      expect(server.createServer).toHaveBeenCalledWith(app, config, expect.any(Function))
    })
  })

  describe('#createServer', () => {
    let port: number
    let app: ReturnType<ServerBase<SocketE2E>['createExpressApp']>

    beforeEach(() => {
      port = 54321
      app = server.createExpressApp({ morgan: true })
    })

    describe('remote state', () => {
      beforeEach(() => {
        vi.spyOn(server, '_listen').mockImplementation((p) => Promise.resolve(p as number))
        vi.spyOn(server, '_port').mockReturnValue(port)
      })

      it('sets remote state to baseUrl when baseUrl is provided', async () => {
        vi.spyOn(ensureUrl, 'isListening').mockReturnValue(Bluebird.resolve(true))
        const setSpy = vi.spyOn(server._remoteStates, 'set')

        await server.createServer(app, { port, baseUrl: 'http://localhost:9999' } as never)

        expect(setSpy).toHaveBeenCalledWith('http://localhost:9999')
      })

      it('sets remote state to <root> when baseUrl is not provided', async () => {
        const setSpy = vi.spyOn(server._remoteStates, 'set')

        await server.createServer(app, { port } as never)

        expect(setSpy).toHaveBeenCalledWith('<root>')
      })
    })

    it('isListening=true', async () => {
      await server.createServer(app, { port } as never)

      expect(server.isListening).toBe(true)
    })

    it('resolves with http server port', async () => {
      const [resolvedPort] = await server.createServer(app, { port } as never)

      expect(resolvedPort).toBe(port)
    })

    it('all servers listen only on localhost and no other interface', async () => {
      /**
       * Avoid real TCP to an arbitrary “other” host (no second NIC, no sandbox EPERM to RFC5737 space).
       * Still exercises real `connect` for 127.0.0.1 against servers bound in `createServer`.
       */
      const realByPort = connect.byPortAndAddress.bind(connect)

      vi.spyOn(connect, 'byPortAndAddress').mockImplementation((port, addr) => {
        if (addr.address === '127.0.0.1') {
          return realByPort(port, addr)
        }

        return Promise.reject(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' as const }))
      })

      createSpy.mockRestore()
      server._fileServer = oldFileServer

      const connectTimeoutMs = 1000

      const otherHost: Address = {
        address: '192.0.2.1',
        family: 'IPv4',
        port: 0,
      }

      const loopbackAddr = (port: number): Address => {
        return {
          address: '127.0.0.1',
          family: 'IPv4',
          port,
        }
      }

      const tryOnlyLoopbackConnect = (p: number) => {
        const nonLoopbackAttempt = Promise.race([
          connect.byPortAndAddress(p, otherHost),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('connect timeout')), connectTimeoutMs)),
        ])

        return Promise.all([
          connect.byPortAndAddress(p, loopbackAddr(p)),
          nonLoopbackAttempt
          .then(() => {
            throw new Error(`Shouldn't be able to connect on ${otherHost.address}:${p}`)
          }).catch((err: NodeJS.ErrnoException | Error) => {
            if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED' || err.message === 'connect timeout') return

            throw err
          }),
        ])
      }

      const [httpPort] = await server.createServer(app, {} as never)

      await Promise.all(
        [
          httpPort,
          server._fileServer!.port(),
          server._httpsProxy!._sniPort,
        ].map((p) => tryOnlyLoopbackConnect(p)),
      )
    })

    it('resolves with warning if cannot connect to baseUrl', async () => {
      vi.spyOn(ensureUrl, 'isListening').mockImplementation(() => {
        return Bluebird.reject(new Error('cannot reach base url for test'))
      })

      const [, warning] = await server.createServer(app, { port, baseUrl: `http://localhost:${port}` } as never)

      expect(warning.type).toBe('CANNOT_CONNECT_BASE_URL_WARNING')

      expect(warning.message).toContain(String(port))

      await new Promise<void>((resolve) => setImmediate(resolve))
    })

    describe('errors', () => {
      it('rejects with portInUse', async () => {
        await server.createServer(app, { port } as never)

        await expect(server.createServer(app, { port } as never)).rejects.toMatchObject({
          type: 'PORT_IN_USE_SHORT',
          message: expect.stringContaining(String(port)),
        })
      })
    })
  })

  describe('#end', () => {
    it('calls this._socket.end', () => {
      const socket = {
        end: vi.fn(),
        close: vi.fn(),
      }

      server._socket = socket as never

      server.end()

      expect(socket.end).toHaveBeenCalled()
    })

    it('is noop without this._socket', () => {
      server.end()
    })
  })

  describe('#startWebsockets', () => {
    let startListening: ReturnType<typeof vi.spyOn<SocketE2E, 'startListening'>>

    beforeEach(() => {
      startListening = vi.spyOn(SocketE2E.prototype, 'startListening').mockImplementation(() => {})
    })

    it('sets _socket and calls _socket#startListening', async () => {
      await server.open(config, getOpenOptions())

      const arg2 = {}

      server.startWebsockets(1 as never, 2 as never, arg2)

      expect(startListening).toHaveBeenCalledWith(server.getHttpServer(), 1, 2, arg2)
    })
  })

  describe('#reset', () => {
    let buffers: { reset: () => void }
    let resetSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
      await server.open(config, getOpenOptions())
      buffers = server._networkProxy!.http
      resetSpy = vi.spyOn(buffers, 'reset')
    })

    it('resets the buffers', () => {
      server.reset()

      expect(resetSpy).toHaveBeenCalled()
    })

    it('sets the domain to the previous base url if set', () => {
      server._baseUrl = 'http://localhost:3000'
      server.reset()

      expect(server._remoteStates.current().strategy).toBe('http')
    })

    it('sets the domain to <root> if not set', () => {
      server.reset()

      expect(server._remoteStates.current().strategy).toBe('file')
    })
  })

  describe('#close', () => {
    it('resolves true successfully bailing out early', async () => {
      const res = await server.close()

      expect(res[0]).toBe(true)
    })

    it('returns a promise', () => {
      expect(typeof server.close().then).toBe('function')
    })

    it('calls close on this.server', async () => {
      await server.open(config, getOpenOptions())

      await server.close()
    })

    it('isListening=false', async () => {
      await server.open(config, getOpenOptions())

      await server.close()

      expect(server.isListening).toBe(false)
    })

    it('calls close on this._socket', async () => {
      server._socket = { close: vi.fn() } as never

      await server.close()

      expect(server._socket.close).toHaveBeenCalledTimes(1)
    })
  })

  describe('#proxyWebsockets', () => {
    let proxy: { ws: ReturnType<typeof vi.fn>, on: ReturnType<typeof vi.fn> }
    let socket: { end: ReturnType<typeof vi.fn>, writable?: boolean }
    let head: Record<string, unknown>

    beforeEach(() => {
      proxy = {
        ws: vi.fn(),
        on: vi.fn(),
      }

      socket = { end: vi.fn() }
      head = {}
    })

    it('is noop if req.url startsWith socketIoRoute', () => {
      const remotePort = 12345
      const req = {
        url: '/foobarbaz',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }

      const socketAllowed = (server as ServerBase<SocketE2E> & { socketAllowed: SocketAllowed }).socketAllowed

      socketAllowed.add({
        localPort: remotePort,
        once: _.noop,
      } as never)

      const noop = server.proxyWebsockets(proxy, '/foo', req as never, socket as never, head as never)

      expect(noop).toBeUndefined()
    })

    it('calls proxy.ws with hostname + port', () => {
      server.remoteStates.set('https://www.google.com')

      const req = {
        connection: {
          encrypted: true,
        },
        url: '/',
        headers: {
          host: 'www.google.com',
        },
      }

      server.proxyWebsockets(proxy, '/foo', req as never, socket as never, head as never)

      expect(proxy.ws).toHaveBeenCalledWith(
        req,
        socket,
        head,
        expect.objectContaining({
          secure: false,
          target: {
            host: 'www.google.com',
            port: '443',
            protocol: 'https:',
          },
        }),
        expect.any(Function),
      )
    })

    it('ends the socket if its writable and there is no __cypress.remoteHost', () => {
      const req = {
        url: '/',
        headers: {
          cookie: 'foo=bar',
        },
      }

      server.proxyWebsockets(proxy, '/foo', req as never, socket as never, head as never)

      expect(socket.end).not.toHaveBeenCalled()

      socket.writable = true
      server.proxyWebsockets(proxy, '/foo', req as never, socket as never, head as never)

      expect(socket.end).toHaveBeenCalled()
    })
  })
})
