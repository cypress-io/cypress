import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import EventEmitter from 'events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtocolManagerShape } from '@packages/types'
import { CriClient } from '../../../lib/browsers/cri-client'
import pDefer from 'p-defer'
import type Protocol from 'devtools-protocol'

const cdp = vi.hoisted(() => {
  type CriStub = {
    send: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    _notifier: EventEmitter
  }

  const state: { criStub: CriStub | null } = { criStub: null }

  const criImport = Object.assign(
    vi.fn(async () => {
      if (!state.criStub) {
        throw new Error('criStub not wired in beforeEach')
      }

      return state.criStub
    }),
    {
      New: vi.fn().mockResolvedValue({ webSocketDebuggerUrl: 'http://web/socket/url' }),
    },
  )

  return { state, criImport }
})

vi.mock('chrome-remote-interface', () => {
  return {
    default: cdp.criImport,
  }
})

const DEBUGGER_URL = 'http://foo'
const HOST = '127.0.0.1'

describe('lib/browsers/cri-client', () => {
  let send: ReturnType<typeof vi.fn>
  let on: ReturnType<typeof vi.fn>
  let off: ReturnType<typeof vi.fn>
  let criStub: {
    send: typeof send
    on: typeof on
    off: typeof off
    close: ReturnType<typeof vi.fn>
    _notifier: EventEmitter
  }
  let onError: ReturnType<typeof vi.fn>
  let onReconnect: ReturnType<typeof vi.fn>

  let getClient: (options?: { host?: string, fullyManageTabs?: boolean, protocolManager?: ProtocolManagerShape }) => ReturnType<typeof CriClient.create>

  const getOnListener = (event: string) => {
    const call = vi.mocked(criStub.on).mock.calls.find(([evt]) => evt === event)

    return call?.[1] as (payload: unknown, sessionId?: string) => void
  }

  const fireCDPEvent = <T extends keyof ProtocolMapping.Events>(method: T, params: Partial<ProtocolMapping.Events[T][0]>, sessionId?: string) => {
    const listener = getOnListener('event')

    if (!listener) {
      throw new Error('missing CRI "event" listener')
    }

    listener({
      method,
      params,
      sessionId,
    })
  }

  const expectCallWithCommandToHaveThrown = (fn: ReturnType<typeof vi.fn>, command: string) => {
    const idx = fn.mock.calls.findIndex((c) => c[0] === command)

    expect(idx, `expected ${command} to have been called`).toBeGreaterThanOrEqual(0)
    expect(fn.mock.results[idx]?.type).toBe('throw')
  }

  beforeEach(() => {
    send = vi.fn()
    onError = vi.fn()
    onReconnect = vi.fn()
    on = vi.fn()
    off = vi.fn()
    criStub = {
      on,
      off,
      send,
      close: vi.fn().mockResolvedValue(undefined),
      _notifier: new EventEmitter(),
    }

    cdp.state.criStub = criStub
    cdp.criImport.mockClear()
    cdp.criImport.mockImplementation(async () => criStub)
    vi.mocked(cdp.criImport.New).mockClear()
    vi.mocked(cdp.criImport.New).mockResolvedValue({ webSocketDebuggerUrl: 'http://web/socket/url' })

    getClient = ({ host, fullyManageTabs, protocolManager } = {}): Promise<CriClient> => {
      return CriClient.create({ target: DEBUGGER_URL, host, onAsynchronousError: onError, fullyManageTabs, protocolManager, onReconnect })
    }
  })

  describe('.create', () => {
    it('returns an instance of the CRI client', async () => {
      const client = await getClient()

      expect(client.send).toBeInstanceOf(Function)
    })

    describe('when it has a host', () => {
      it('adds a crash listener', async () => {
        const client = await getClient({ host: HOST })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).toBe(true)
      })
    })

    describe('when it does not have a host', () => {
      it('does not add a crash listener', async () => {
        const client = await getClient()

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })
        expect(client.crashed).toBe(false)
      })
    })

    describe('when it has a host and is fully managed and receives an attachedToTarget event', () => {
      beforeEach(async () => {
        await getClient({ host: HOST, fullyManageTabs: true })
        criStub.send.mockResolvedValue(undefined)
      })

      describe('target type is service worker, page, or other', () => {
        it('does not enable network', async () => {
          await Promise.all(['service_worker', 'page', 'other'].map((type) => {
            fireCDPEvent('Target.attachedToTarget', {
              targetInfo: {
                type,
              } as Protocol.Target.TargetInfo,
            })

            return Promise.resolve()
          }))

          expect(criStub.send.mock.calls.some((c) => c[0] === 'Network.enable')).toBe(false)
        })
      })

      describe('target type is something other than service worker, page, or other', () => {
        it('enables network', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            targetInfo: {
              type: 'iframe',
            } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send.mock.calls.some((c) => c[0] === 'Network.enable')).toBe(true)
        })
      })

      describe('target is waiting for debugger', () => {
        const sessionId = 'abc123'

        it('sends Runtime.runIfWaitingForDebugger', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send).toHaveBeenCalledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('does not send Runtime.runIfWaitingForDebugger if not waiting for debugger', async () => {
          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: false,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expect(criStub.send.mock.calls.some((c) => c[0] === 'Runtime.runIfWaitingForDebugger')).toBe(false)
        })

        it('sends Runtime.runIfWaitingForDebugger even if Network.enable throws', async () => {
          vi.mocked(criStub.send).mockImplementation((cmd: string) => {
            if (cmd === 'Network.enable') {
              throw new Error('ProtocolError: Inspected target closed')
            }

            return Promise.resolve(undefined)
          })

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'iframe' } as Protocol.Target.TargetInfo,
          })

          expectCallWithCommandToHaveThrown(criStub.send, 'Network.enable')
          expect(criStub.send).toHaveBeenCalledWith('Runtime.runIfWaitingForDebugger', undefined, sessionId)
        })

        it('continues even if Runtime.runIfWaitingForDebugger throws', async () => {
          vi.mocked(criStub.send).mockImplementation((cmd: string) => {
            if (cmd === 'Runtime.runIfWaitingForDebugger') {
              throw new Error('ProtocolError: Inspected target closed')
            }

            return Promise.resolve(undefined)
          })

          await fireCDPEvent('Target.attachedToTarget', {
            waitingForDebugger: true,
            sessionId,
            targetInfo: { type: 'service_worker' } as Protocol.Target.TargetInfo,
          })

          expectCallWithCommandToHaveThrown(criStub.send, 'Runtime.runIfWaitingForDebugger')
        })
      })
    })

    describe('#send', () => {
      it('calls cri.send with command and data', async () => {
        send.mockResolvedValue(undefined)
        const client = await getClient()

        client.send('DOM.getDocument', { depth: -1 })
        expect(send).toHaveBeenCalledWith('DOM.getDocument', { depth: -1 }, undefined)
      })

      it('rejects if cri.send rejects', async () => {
        const err = new Error('send failed')

        send.mockRejectedValue(err)
        const client = await getClient()

        await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toBe(err)
      })

      it('rejects if target has crashed', async () => {
        const command = 'DOM.getDocument'
        const client = await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        fireCDPEvent('Target.targetCrashed', { targetId: DEBUGGER_URL })

        await expect(client.send(command, { depth: -1 })).rejects.toThrow(
          `${command} will not run as the target browser or tab CRI connection has crashed`,
        )
      })

      it('does not reject if attachToTarget work throws', async () => {
        vi.mocked(criStub.send).mockImplementation((cmd: string) => {
          if (cmd === 'Network.enable') {
            throw new Error('ProtocolError: Inspected target navigated or closed')
          }

          return Promise.resolve(undefined)
        })

        await getClient({ host: '127.0.0.1', fullyManageTabs: true })

        await fireCDPEvent('Target.attachedToTarget', { targetInfo: { type: 'worker', targetId: DEBUGGER_URL, title: '', url: 'https://some_url', attached: true, canAccessOpener: true } })
      })

      describe('retries', () => {
        [
          'WebSocket is not open',
          // @see https://github.com/cypress-io/cypress/issues/7180
          'WebSocket is already in CLOSING or CLOSED state',
          'WebSocket connection closed',
        ].forEach((msg) => {
          it(`with one '${msg}' message it retries once`, async () => {
            const err = new Error(msg)

            send
            .mockRejectedValueOnce(err)
            .mockResolvedValueOnce(undefined)

            const client = await getClient()

            const p = client.send('DOM.getDocument', { depth: -1 })

            const disconnectHandler = getOnListener('disconnect')

            expect(disconnectHandler).toBeDefined()
            await disconnectHandler!()
            await p
            expect(send).toHaveBeenCalledTimes(2)
          })

          it(`with two '${msg}' message it retries twice`, async () => {
            const err = new Error(msg)

            send
            .mockRejectedValueOnce(err)
            .mockRejectedValueOnce(err)
            .mockResolvedValueOnce(undefined)

            const client = await getClient()

            const getDocumentPromise = client.send('DOM.getDocument', { depth: -1 })

            const disconnectHandler = getOnListener('disconnect')

            expect(disconnectHandler).toBeDefined()
            await disconnectHandler!()
            await disconnectHandler!()
            await getDocumentPromise
            expect(send).toHaveBeenCalledTimes(3)
          })

          it(`with two '${msg}' message it retries enablements twice`, async () => {
            const err = new Error(msg)

            send
            .mockRejectedValueOnce(err)
            .mockRejectedValueOnce(err)
            .mockResolvedValueOnce(undefined)

            const client = await getClient()

            const enableNetworkPromise = client.send('Network.enable')

            const disconnectHandler = getOnListener('disconnect')

            expect(disconnectHandler).toBeDefined()
            await disconnectHandler!()
            await disconnectHandler!()
            await enableNetworkPromise
            expect(send).toHaveBeenCalledTimes(3)
          })
        })
      })

      describe('closed', () => {
        it(`when socket is closed mid send'`, async () => {
          const err = new Error('WebSocket is not open: readyState 3 (CLOSED)')

          send.mockRejectedValueOnce(err)

          const client = await getClient()

          await client.close()

          await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toThrow(
            'DOM.getDocument will not run as browser CRI connection was reset',
          )
        })

        it(`when socket is closed mid send ('WebSocket connection closed' variant)`, async () => {
          const err = new Error('WebSocket connection closed')

          send.mockRejectedValueOnce(err)
          const client = await getClient()

          await client.close()

          await expect(client.send('DOM.getDocument', { depth: -1 })).rejects.toThrow(
            'DOM.getDocument will not run as browser CRI connection was reset',
          )
        })
      })
    })
  })

  describe('clone', () => {
    it('returns a new CriClient with the same options', async () => {
      const client = await getClient()

      const cloned = await client.clone()

      expect(cloned['targetId']).toBe(client['targetId'])
      expect(cloned['onAsynchronousError']).toBe(client['onAsynchronousError'])
      expect(cloned['host']).toBe(client['host'])
      expect(cloned['port']).toBe(client['port'])
      expect(cloned['protocolManager']).toBe(client['protocolManager'])
      expect(cloned['fullyManageTabs']).toBe(client['fullyManageTabs'])
      expect(cloned['browserClient']).toBe(client['browserClient'])
    })
  })

  describe('on reconnect', () => {
    it('resends *.enable commands and notifies protocol manager', async () => {
      criStub._notifier.on = vi.fn() as typeof criStub._notifier.on

      const protocolManager = {
        cdpReconnect: vi.fn(),
      } as ProtocolManagerShape

      const client = await getClient({
        protocolManager,
      })

      client.send('Page.enable')
      // @ts-expect-error exercise replay path
      client.send('Page.foo')
      // @ts-expect-error exercise replay path
      client.send('Page.bar')
      client.send('Network.enable')
      // @ts-expect-error exercise replay path
      client.send('Network.baz')

      criStub.send.mockClear()

      const disconnectHandler = getOnListener('disconnect')

      expect(disconnectHandler).toBeDefined()
      await disconnectHandler!()

      const reconnection = pDefer<void>()

      onReconnect.mockImplementation(() => {
        reconnection.resolve()
      })

      await reconnection.promise

      expect(criStub.send).toHaveBeenCalledTimes(2)
      expect(criStub.send).toHaveBeenCalledWith('Page.enable', undefined, undefined)
      expect(criStub.send).toHaveBeenCalledWith('Network.enable', undefined, undefined)
      expect(protocolManager.cdpReconnect).toHaveBeenCalled()

      await disconnectHandler!()
    })

    it('errors if reconnecting fails', async () => {
      await getClient()

      cdp.criImport.mockRejectedValue(new Error('CDP reconnect failed'))

      const disconnectHandler = getOnListener('disconnect')

      expect(disconnectHandler).toBeDefined()
      await disconnectHandler!()

      await new Promise((resolve) => setImmediate(resolve))

      expect(onError).toHaveBeenCalled()

      const error = onError.mock.calls[onError.mock.calls.length - 1]![0] as {
        messageMarkdown: string
        isFatalApiErr: boolean
      }

      expect(error.messageMarkdown).toBe('There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.')
      expect(error.isFatalApiErr).toBe(true)
    })
  })
})
