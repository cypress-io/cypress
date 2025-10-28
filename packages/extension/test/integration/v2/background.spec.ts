import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import _ from 'lodash'
import http from 'http'
import { SocketIOServer } from '@packages/socket'
import { connect } from '../../../app/v2/client'
import EventEmitter from 'events'
import type { SocketShape } from '@packages/socket/browser/client'
import browser from 'webextension-polyfill'
import { automation } from '../../../app/v2/background'

vi.mock('../../../app/v2/client', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    connect: vi.fn(),
  }
})

vi.mock('webextension-polyfill', () => {
  return {
    default: {
      cookies: {
        onChanged: {
          addListener: vi.fn(),
        },
      },
      downloads: {
        onCreated: {
          addListener: vi.fn(),
        },
        onChanged: {
          addListener: vi.fn(),
        },
      },
      runtime: {},
      browsingData: {
        remove: vi.fn(),
      },
    },
  }
})

const PORT = 12345

describe('app/background', () => {
  let httpSrv: http.Server
  let server: http.Server
  let connectWrapper: (options?: Record<string, unknown>) => Promise<SocketShape>

  beforeEach(async () => {
    vi.resetAllMocks()
    vi.stubGlobal('window', {})

    httpSrv = http.createServer()

    // @ts-expect-error
    server = new SocketIOServer(httpSrv, { path: '/__socket' })

    // use an event emitter and wrap in in a vitest mock to assert on calls
    const webSocketEventBus = new EventEmitter()
    const ws = {
      on: vi.fn().mockImplementation(webSocketEventBus.on),
      emit: vi.fn(webSocketEventBus.emit),
    } as unknown as SocketShape

    vi.mocked(connect).mockReturnValue(ws)

    browser.runtime.getBrowserInfo = vi.fn().mockResolvedValue({ name: 'Firefox' })

    connectWrapper = async (options = {}) => {
      const ws = automation.connect(`http://localhost:${PORT}`, '/__socket.io')

      // skip 'connect' and 'automation:client:connected' and trigger
      // the handler that kicks everything off
      ws.emit('automation:config', options)

      await new Promise<void>((resolve) => setTimeout(resolve, 1))

      return ws
    }

    return new Promise<void>((resolve) => {
      httpSrv.listen(PORT, resolve)
    })
  })

  afterEach(function () {
    server.close()

    return new Promise<void>((resolve) => {
      httpSrv.close(() => {
        resolve()
      })
    })
  })

  describe('.connect', () => {
    it('emits \'automation:client:connected\'', async function () {
      const ws = automation.connect(`http://localhost:${PORT}`, '/__socket.io')

      ws.emit('connect')

      expect(ws.emit).toHaveBeenCalledWith('automation:client:connected')
    })

    it('listens to cookie changes', async function () {
      await connectWrapper()

      expect(browser.cookies.onChanged.addListener).toHaveBeenCalledOnce()
    })
  })

  describe('cookies', () => {
    it('onChanged does not emit when cause is overwrite', async function () {
      const ws = await connectWrapper()
      // @ts-expect-error
      const fn = browser.cookies.onChanged.addListener.mock.calls[0][0]

      fn({ cause: 'overwrite' })

      expect(ws.emit).not.toHaveBeenCalledWith('automation:push:request')
    })

    it('onChanged emits automation:push:request change:cookie', async function () {
      const info = { cause: 'explicit', cookie: { name: 'foo', value: 'bar' } }

      vi.mocked(browser.cookies.onChanged.addListener).mockImplementation((fn) => fn(info as any))

      const ws = await connectWrapper()

      expect(ws.emit).toHaveBeenCalledWith('automation:push:request', 'change:cookie', info)
    })
  })

  describe('downloads', () => {
    it('onCreated emits automation:push:request create:download', async function () {
      const downloadItem = {
        id: '1',
        filename: '/path/to/download.csv',
        mime: 'text/csv',
        url: 'http://localhost:1234/download.csv',
      }

      vi.mocked(browser.downloads.onCreated.addListener).mockImplementation((fn) => fn(downloadItem as any))

      const ws = await connectWrapper()

      expect(ws.emit).toHaveBeenCalledWith('automation:push:request', 'create:download', {
        id: `${downloadItem.id}`,
        filePath: downloadItem.filename,
        mime: downloadItem.mime,
        url: downloadItem.url,
      })
    })

    it('onChanged emits automation:push:request complete:download', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'complete',
        },
      }

      vi.mocked(browser.downloads.onChanged.addListener).mockImplementation((fn) => fn(downloadDelta as any))

      const ws = await connectWrapper()

      expect(ws.emit).toHaveBeenCalledWith('automation:push:request', 'complete:download', {
        id: `${downloadDelta.id}`,
      })
    })

    it('onChanged emits automation:push:request canceled:download', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'canceled',
        },
      }

      vi.mocked(browser.downloads.onChanged.addListener).mockImplementation((fn) => fn(downloadDelta as any))

      const ws = await connectWrapper()

      expect(ws.emit).toHaveBeenCalledWith('automation:push:request', 'canceled:download', {
        id: `${downloadDelta.id}`,
      })
    })

    it('onChanged does not emit if state does not exist', async function () {
      const downloadDelta = {
        id: '1',
      }

      vi.mocked(browser.downloads.onChanged.addListener).mockImplementation((fn) => fn(downloadDelta as any))

      const ws = await connectWrapper()

      expect(ws.emit).not.toHaveBeenCalledWith('automation:push:request')
    })

    it('onChanged does not emit if state.current is not "complete"', async function () {
      const downloadDelta = {
        id: '1',
        state: {
          current: 'inprogress',
        },
      }

      vi.mocked(browser.downloads.onChanged.addListener).mockImplementation((fn) => fn(downloadDelta as any))

      const ws = await connectWrapper()

      expect(ws.emit).not.toHaveBeenCalledWith('automation:push:request')
    })

    it('does not add downloads listener if in non-Firefox browser', async function () {
      vi.mocked(browser.runtime.getBrowserInfo).mockResolvedValue({ name: 'Chrome' } as any)

      await connectWrapper()

      expect(browser.downloads.onCreated.addListener).not.toHaveBeenCalled()
      expect(browser.downloads.onChanged.addListener).not.toHaveBeenCalled()
    })
  })

  describe('integration', () => {
    let socket: SocketShape

    beforeEach(async function () {
      const { connect: connectActual } = await vi.importActual<typeof import('../../../app/v2/client')>('../../../app/v2/client')

      vi.mocked(connect).mockImplementation(connectActual)

      await new Promise<void>((resolve) => {
        server.on('connection', (socket1) => {
          socket = socket1 as unknown as SocketShape

          resolve()
        })

        automation.connect(`http://localhost:${PORT}`, '/__socket')
      })
    })

    describe('reset:browser:state', () => {
      beforeEach(() => {
        vi.mocked(browser.browsingData.remove).mockImplementation((args: any, options: any) => {
          if (_.isEqual(args, {}) && _.isEqual(options, { cache: true, cookies: true, downloads: true, formData: true, history: true, indexedDB: true, localStorage: true, passwords: true, pluginData: true, serviceWorkers: true })) {
            return Promise.resolve()
          }

          return Promise.reject(new Error('Unexpected arguments'))
        })
      })

      it('resets the browser state', function () {
        return new Promise<void>((resolve) => {
          socket.on('automation:response', (id: number, obj: { response: unknown }) => {
            expect(id).toEqual(123)
            expect(obj.response).toBeUndefined()

            expect(browser.browsingData.remove).toHaveBeenCalled()

            resolve()
          })

          server.emit('automation:request', 123, 'reset:browser:state')
        })
      })
    })
  })
})
