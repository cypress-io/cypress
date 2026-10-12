import { isDeepStrictEqual } from 'util'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { ProtocolManagerShape } from '@packages/types'
import { REPORTER_FRAME_NAME, AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER, SPEC_FRAME_NAME_IDENTIFIER, SPEC_BRIDGE_FRAME_NAME_IDENTIFIER } from '@packages/types'
import { CdpAutomation } from '../../../lib/browsers/cdp-protocol/cdp_automation'
import { normalizeResourceType } from '../../../lib/browsers/cdp-protocol/normalize-resource-type'
import { CDPDisconnectedError } from '../../../lib/browsers/cdp-protocol/cri-errors'

type Impl = (...args: any[]) => unknown

type ArgFake = {
  readonly calls: unknown[][]
  resolves: (value?: unknown) => ArgFake
  rejects: (err?: unknown) => ArgFake
  callsFake: (impl: Impl) => ArgFake
  withArgs: (...args: unknown[]) => ArgFake
  yield: (...callbackArgs: unknown[]) => void
}

type Stub = Mock & { withArgs: (...args: unknown[]) => ArgFake }

// a call matches when its leading arguments deep-equal `expected`
const argsMatch = (args: unknown[], expected: unknown[]) => {
  return expected.length <= args.length && isDeepStrictEqual(args.slice(0, expected.length), expected)
}

const callsWith = (mock: Mock, ...expected: unknown[]) => {
  return mock.mock.calls.filter((args) => argsMatch(args, expected))
}

const callsOf = (target: Mock | ArgFake) => ('mock' in target ? target.mock.calls : target.calls)

const expectCalledWith = (target: Mock | ArgFake, ...expected: unknown[]) => {
  expect(callsOf(target).filter((args) => argsMatch(args, expected)), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (target: Mock | ArgFake, ...expected: unknown[]) => {
  expect(callsOf(target).filter((args) => argsMatch(args, expected)), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

// answers each call from the `withArgs` registration with the longest matching
// argument prefix; a registration without a behavior defers to `defaultImpl`
const createStub = (defaultImpl?: Impl): Stub => {
  const fakes: { args: unknown[], impl?: Impl }[] = []

  const stub = vi.fn((...args: unknown[]) => {
    const fake = fakes
    .filter((candidate) => argsMatch(args, candidate.args))
    .sort((a, b) => a.args.length - b.args.length)
    .pop()

    return (fake?.impl ?? defaultImpl)?.(...args)
  })

  const withArgs = (...args: unknown[]): ArgFake => {
    let fake = fakes.find((candidate) => isDeepStrictEqual(candidate.args, args))

    if (!fake) {
      fake = { args }
      fakes.push(fake)
    }

    const registered = fake

    const view: ArgFake = {
      get calls () {
        return callsWith(stub, ...args)
      },
      resolves: (value) => {
        registered.impl = () => Promise.resolve(value)

        return view
      },
      rejects: (err = new Error('Error')) => {
        registered.impl = () => Promise.reject(err)

        return view
      },
      callsFake: (impl) => {
        registered.impl = impl

        return view
      },
      withArgs,
      yield: (...callbackArgs) => {
        if (!view.calls.length) {
          throw new Error(`cannot yield since ${String(args[0])} was not yet invoked`)
        }

        for (const call of view.calls) {
          const callback = call.find((arg) => typeof arg === 'function') as Impl

          callback(...callbackArgs)
        }
      },
    }

    return view
  }

  return Object.assign(stub, { withArgs })
}

describe('lib/browsers/cdp_automation', () => {
  describe('.normalizeResourceType', () => {
    it('passes through every supported type, lowercasing CDP\'s PascalCase', () => {
      // the CDP Protocol.Network.ResourceType values that map 1:1; playwright's
      // request.resourceType() reports the same names already lowercased
      const passthrough = ['Fetch', 'XHR', 'WebSocket', 'Stylesheet', 'Script', 'Image', 'Font', 'CSPViolationReport', 'Ping', 'Manifest', 'Other']

      passthrough.forEach((type) => {
        expect(normalizeResourceType(type)).toBe(type.toLowerCase())
      })
    })

    it('normalizes unsupported types to other', () => {
      // the remaining CDP ResourceType values plus playwright's texttrack/media
      const unsupported = ['Document', 'Media', 'TextTrack', 'Prefetch', 'EventSource', 'SignedExchange', 'Preflight', 'FedCM']

      unsupported.forEach((type) => {
        expect(normalizeResourceType(type)).toBe('other')
      })
    })

    it('normalizes undefined to other', () => {
      expect(normalizeResourceType(undefined)).toBe('other')
    })
  })

  describe('.CdpAutomation', () => {
    let cdpAutomation: CdpAutomation
    let sendDebuggerCommand: Stub
    let onFn: Stub
    let offFn: Mock
    let sendCloseTargetCommand: Mock
    let automation: any
    let onRequest: any

    describe('create', () => {
      it('networkEnabledOptions - protocol enabled', async () => {
        const enabledObject = {
          maxPostDataSize: 64 * 1024,
          maxResourceBufferSize: 0,
          maxTotalBufferSize: 0,
        }
        const localCommand = createStub()
        const localOnFn = vi.fn()
        const localOffFn = vi.fn()
        const localSendCloseTargetCommand = vi.fn()
        const localAutomation = {
          onBrowserPreRequest: vi.fn(),
          onRequestEvent: vi.fn(),
        }
        const localManager = {
          isProtocolEnabled: false,
          networkEnableOptions: enabledObject,
        } as ProtocolManagerShape

        const localNetworkCommandStub = localCommand.withArgs('Network.enable', enabledObject).resolves()

        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any, localManager)

        expectCalledWith(localNetworkCommandStub, 'Network.enable', enabledObject)
      })

      it('networkEnabledOptions - protocol disabled', async () => {
        const disabledObject = {
          maxTotalBufferSize: 0,
          maxResourceBufferSize: 0,
          maxPostDataSize: 0,
        }
        const localCommand = createStub()
        const localOnFn = vi.fn()
        const localOffFn = vi.fn()
        const localSendCloseTargetCommand = vi.fn()
        const localAutomation = {
          onBrowserPreRequest: vi.fn(),
          onRequestEvent: vi.fn(),
        }
        const localManager = {
          isProtocolEnabled: false,
          networkEnableOptions: disabledObject,
        } as ProtocolManagerShape

        const localCommandStub = localCommand.withArgs('Network.enable', disabledObject).resolves()

        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any, localManager)
        await CdpAutomation.create(localCommand, localOnFn, localOffFn, localSendCloseTargetCommand, localAutomation as any)

        expect(localCommandStub.calls).toHaveLength(2)
        expect(localCommandStub.calls.some((args) => isDeepStrictEqual(args, ['Network.enable', disabledObject]))).toBe(true)
      })
    })

    beforeEach(async () => {
      sendDebuggerCommand = createStub()
      onFn = createStub()
      offFn = vi.fn()

      sendCloseTargetCommand = vi.fn()
      automation = {
        onBrowserPreRequest: vi.fn(),
        onRequestEvent: vi.fn(),
        onRemoveBrowserPreRequest: vi.fn(),
        onServiceWorkerRegistrationUpdated: vi.fn(),
        onServiceWorkerVersionUpdated: vi.fn(),
      }

      cdpAutomation = await CdpAutomation.create(sendDebuggerCommand, onFn, offFn, sendCloseTargetCommand, automation)
      onRequest = cdpAutomation.onRequest
    })

    describe('.startVideoRecording', () => {
      // https://github.com/cypress-io/cypress/issues/9265
      it('respond ACK after receiving new screenshot frame', async () => {
        const writeVideoFrame = vi.fn()
        const frameMeta = { data: Buffer.from('foo'), sessionId: '1' }

        onFn.withArgs('Page.screencastFrame').callsFake((e, fn) => {
          fn(frameMeta)
        })

        const startScreencast = sendDebuggerCommand.withArgs('Page.startScreencast').resolves()
        const screencastFrameAck = sendDebuggerCommand.withArgs('Page.screencastFrameAck').resolves()

        await cdpAutomation.startVideoRecording(writeVideoFrame, {})

        expectCalledWith(startScreencast, 'Page.startScreencast')
        expect(writeVideoFrame.mock.calls.some(([arg]) => Buffer.isBuffer(arg) && arg.length > 0)).toBe(true)
        expectCalledWith(screencastFrameAck, 'Page.screencastFrameAck', { sessionId: frameMeta.sessionId })
      })

      it('swallows a CDPDisconnectedError from the ack (e.g. racing a terminal disconnect)', async () => {
        const writeVideoFrame = vi.fn()
        const frameMeta = { data: Buffer.from('foo'), sessionId: '1' }

        sendDebuggerCommand.withArgs('Page.startScreencast').resolves()
        sendDebuggerCommand.withArgs('Page.screencastFrameAck').rejects(new CDPDisconnectedError('Page.screencastFrameAck will not run as the CRI connection to Target foo has been closed'))

        await cdpAutomation.startVideoRecording(writeVideoFrame, {})

        const screencastFrameHandler = callsWith(onFn, 'Page.screencastFrame')[0][1]

        await screencastFrameHandler(frameMeta)
      })

      it('rethrows other errors from the ack', async () => {
        const writeVideoFrame = vi.fn()
        const frameMeta = { data: Buffer.from('foo'), sessionId: '1' }
        const err = new Error('boom')

        sendDebuggerCommand.withArgs('Page.startScreencast').resolves()
        sendDebuggerCommand.withArgs('Page.screencastFrameAck').rejects(err)

        await cdpAutomation.startVideoRecording(writeVideoFrame, {})

        const screencastFrameHandler = callsWith(onFn, 'Page.screencastFrame')[0][1]

        await expect(screencastFrameHandler(frameMeta)).rejects.toBe(err)
      })
    })

    describe('.onNetworkRequestWillBeSent', () => {
      it('triggers onBrowserPreRequest', () => {
        const browserPreRequest = {
          requestId: '0',
          type: 'other',
          request: {
            method: 'GET',
            url: 'https://www.google.com',
            headers: {},
          },
          wallTime: 100.100100,
        }

        onFn
        .withArgs('Network.requestWillBeSent')
        .yield(browserPreRequest)

        const arg = automation.onBrowserPreRequest.mock.calls[0][0]

        expect(arg.requestId).toBe(browserPreRequest.requestId)
        expect(arg.method).toBe(browserPreRequest.request.method)
        expect(arg.url).toBe(browserPreRequest.request.url)
        expect(arg.headers).toBe(browserPreRequest.request.headers)
        expect(arg.resourceType).toBe(browserPreRequest.type)
        expect(arg.originalResourceType).toBe(browserPreRequest.type)
        expect(Math.abs(arg.cdpRequestWillBeSentTimestamp - 100100.100)).toBeLessThanOrEqual(0.001)
        expect(arg.cdpRequestWillBeSentReceivedTimestamp).toBeTypeOf('number')
      })

      it('ignore events with data urls', () => {
        onFn
        .withArgs('Network.requestWillBeSent')
        .yield({ requestId: '0', request: { url: 'data:font;base64' } })

        expect(automation.onBrowserPreRequest).not.toHaveBeenCalled()
        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).toBe(true)
        expect(cdpAutomation['cachedDataUrlRequestIds']).toHaveProperty('size', 1)
      })
    })

    describe('.onResponseReceived', () => {
      it('triggers onRequestEvent', () => {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
          },
        }

        onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expectCalledWith(automation.onRequestEvent,
          'response:received', {
            requestId: browserResponseReceived.requestId,
            status: browserResponseReceived.response.status,
            headers: browserResponseReceived.response.headers,
          },
        )
      })

      it('triggers onRequestEvent when response is cached from service worker but data length is > 0', () => {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromServiceWorker: true,
            encodedDataLength: 1,
          },
        }

        onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expectCalledWith(automation.onRequestEvent,
          'response:received', {
            requestId: browserResponseReceived.requestId,
            status: browserResponseReceived.response.status,
            headers: browserResponseReceived.response.headers,
          },
        )
      })

      it('cleans up prerequests when response is cached from disk', () => {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromDiskCache: true,
          },
        }

        onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(automation.onRequestEvent).not.toHaveBeenCalled()
      })

      it('cleans up prerequests when response is cached from service worker and data length is <= 0', () => {
        const browserResponseReceived = {
          requestId: '0',
          response: {
            status: 200,
            headers: {},
            fromServiceWorker: true,
            encodedDataLength: -1,
          },
        }

        onFn
        .withArgs('Network.responseReceived')
        .yield(browserResponseReceived)

        expect(automation.onRequestEvent).not.toHaveBeenCalled()
      })
    })

    describe('.onRequestServedFromCache', () => {
      it('triggers onRemoveBrowserPreRequest', () => {
        const browserRequestServedFromCache = {
          requestId: '0',
        }

        onFn
        .withArgs('Network.requestServedFromCache')
        .yield(browserRequestServedFromCache)

        expectCalledWith(automation.onRemoveBrowserPreRequest, browserRequestServedFromCache.requestId)
      })

      it('ignores cached data url request ids', () => {
        onFn
        .withArgs('Network.requestWillBeSent')
        .yield({ requestId: '0', request: { url: 'data:font;base64' } })

        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).toBe(true)
        expect(cdpAutomation['cachedDataUrlRequestIds']).toHaveProperty('size', 1)

        onFn
        .withArgs('Network.requestServedFromCache')
        .yield({ requestId: '0' })

        expect(automation.onRemoveBrowserPreRequest).not.toHaveBeenCalled()
        expect(cdpAutomation['cachedDataUrlRequestIds'].has('0')).toBe(false)
        expect(cdpAutomation['cachedDataUrlRequestIds']).toHaveProperty('size', 0)
      })
    })

    describe('.onRequestFailed', () => {
      it('triggers onRemoveBrowserPreRequest', () => {
        const browserRequestFailed = {
          requestId: '0',
        }

        onFn
        .withArgs('Network.loadingFailed')
        .yield(browserRequestFailed)

        expectCalledWith(automation.onRemoveBrowserPreRequest, browserRequestFailed.requestId)
      })
    })

    describe('.onWorkerRegistrationUpdated', () => {
      it('triggers onServiceWorkerRegistrationUpdated', () => {
        const browserWorkerRegistrationUpdated = {
          registrations: [{
            registrationId: '0',
            scopeURL: 'https://www.google.com',
          }],
        }

        onFn
        .withArgs('ServiceWorker.workerRegistrationUpdated')
        .yield(browserWorkerRegistrationUpdated)

        expectCalledWith(automation.onServiceWorkerRegistrationUpdated, browserWorkerRegistrationUpdated)
      })
    })

    describe('.onWorkerVersionUpdated', () => {
      it('triggers onServiceWorkerVersionUpdated', () => {
        const browserWorkerVersionUpdated = {
          versions: [{
            registrationId: '0',
            versionId: '1',
            scriptURL: 'https://www.google.com',
          }],
        }

        onFn
        .withArgs('ServiceWorker.workerVersionUpdated')
        .yield(browserWorkerVersionUpdated)

        expectCalledWith(automation.onServiceWorkerVersionUpdated, browserWorkerVersionUpdated)
      })
    })

    describe('get:cookies', () => {
      beforeEach(() => {
        sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expires: 123 },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expires: 456 },
            { name: 'qux', value: 'q', path: '/', domain: 'foobar.com', secure: false, httpOnly: false, expires: 789 },
          ],
        })
      })

      it('returns cookies that match filter', () => {
        return onRequest('get:cookies', { domain: 'localhost' })
        .then((resp) => {
          expect(resp).toStrictEqual([
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, sameSite: undefined },
          ])
        })
      })

      it('returns all cookies if there is no filter', () => {
        return onRequest('get:cookies', {})
        .then((resp) => {
          expect(resp).toStrictEqual([
            { name: 'foo', value: 'f', path: '/', domain: 'localhost', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined },
            { name: 'bar', value: 'b', path: '/', domain: 'localhost', secure: false, httpOnly: false, expirationDate: 456, sameSite: undefined },
            { name: 'qux', value: 'q', path: '/', domain: 'foobar.com', secure: false, hostOnly: true, httpOnly: false, expirationDate: 789, sameSite: undefined },
          ])
        })
      })
    })

    describe('get:cookie', () => {
      beforeEach(() => {
        sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/login', domain: 'google.com', secure: true, httpOnly: true, expires: 123 },
          ],
        })
      })

      it('returns a specific cookie by name', () => {
        return onRequest('get:cookie', { domain: 'google.com', name: 'session' })
        .then((resp) => {
          expect(resp).toStrictEqual({ name: 'session', value: 'key', path: '/login', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined, hostOnly: true })
        })
      })

      it('returns null when no cookie by name is found', () => {
        return onRequest('get:cookie', { domain: 'google.com', name: 'doesNotExist' })
        .then((resp) => {
          expect(resp).toBeNull()
        })
      })
    })

    describe('set:cookie', () => {
      beforeEach(() => {
        sendDebuggerCommand.withArgs('Network.setCookie', { domain: '.google.com', name: 'session', value: 'key', path: '/' })
        .resolves({ success: true })
        .withArgs('Network.setCookie', { domain: 'foo', path: '/bar', name: '', value: '' })
        .rejects(new Error('some error'))
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: '.google.com', secure: false, httpOnly: false },
          ],
        })
      })

      it('resolves with the cookie props', () => {
        return onRequest('set:cookie', { domain: 'google.com', name: 'session', value: 'key', path: '/' })
        .then((resp) => {
          expect(resp).toStrictEqual({ domain: '.google.com', expirationDate: undefined, httpOnly: false, name: 'session', value: 'key', path: '/', secure: false, sameSite: undefined })
        })
      })

      it('resolves with the cookie props (host only)', () => {
        sendDebuggerCommand
        .withArgs('Network.setCookie', { domain: 'google.com', name: 'session', value: 'key', path: '/' })
        .resolves({ success: true })
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: false, httpOnly: false },
          ],
        })

        return onRequest('set:cookie', { domain: 'google.com', name: 'session', value: 'key', path: '/', hostOnly: true })
        .then((resp) => {
          expect(resp).toStrictEqual({ domain: 'google.com', expirationDate: undefined, hostOnly: true, httpOnly: false, name: 'session', value: 'key', path: '/', secure: false, sameSite: undefined })
        })
      })

      it('rejects with error', () => {
        return onRequest('set:cookie', { domain: 'foo', path: '/bar' })
        .then(() => {
          throw new Error('should have failed')
        }).catch((err) => {
          expect(err.message).toBe('some error')
        })
      })
    })

    describe('clear:cookie', () => {
      beforeEach(() => {
        sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expires: 123 },
            { name: 'shouldThrow', value: 'key', path: '/assets', domain: 'cdn.github.com', secure: false, httpOnly: true, expires: 123 },
          ],
        })

        sendDebuggerCommand.withArgs('Network.deleteCookies', { domain: 'cdn.github.com', name: 'shouldThrow' })
        .rejects(new Error('some error'))
        .withArgs('Network.deleteCookies')
        .resolves()
      })

      it('resolves single removed cookie', () => {
        return onRequest('clear:cookie', { domain: 'google.com', name: 'session' })
        .then((resp) => {
          expect(resp).toStrictEqual(
            { name: 'session', value: 'key', path: '/', domain: 'google.com', secure: true, httpOnly: true, expirationDate: 123, sameSite: undefined, hostOnly: true },
          )
        })
      })

      it('returns null when no cookie by name is found', () => {
        return onRequest('clear:cookie', { domain: 'google.com', name: 'doesNotExist' })
        .then((resp) => {
          expect(resp).toBeNull()
        })
      })

      it('rejects with error', () => {
        return onRequest('clear:cookie', { domain: 'cdn.github.com', name: 'shouldThrow' })
        .then(() => {
          throw new Error('should have failed')
        }).catch((err) => {
          expect(err.message).toBe('some error')
        })
      })
    })

    describe('take:screenshot', () => {
      beforeEach(() => {
        sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
      })

      describe('when tab focus behavior default (disabled)', () => {
        it('resolves with base64 data URL', () => {
          sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

          return expect(onRequest('take:screenshot'))
          .resolves.toBe('data:image/png;base64,foo')
        })

        it('rejects nicely if Page.captureScreenshot fails', () => {
          sendDebuggerCommand.withArgs('Page.captureScreenshot').rejects()

          return expect(onRequest('take:screenshot'))
          .rejects.toThrow('The browser responded with an error when Cypress attempted to take a screenshot.')
        })
      })

      describe('when tab focus behavior is enabled', () => {
        let requireTabFocus
        let isHeadless

        beforeEach(() => {
          requireTabFocus = true
        })

        describe('when headless', () => {
          beforeEach(() => {
            isHeadless = true
          })

          it('does not try to comm with extension, simply brings page to front', async () => {
            cdpAutomation = await CdpAutomation.create(sendDebuggerCommand, onFn, offFn, sendCloseTargetCommand, automation, undefined, requireTabFocus, isHeadless)
            sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

            await expect(cdpAutomation.onRequest('take:screenshot', undefined)).resolves.toBe('data:image/png;base64,foo')
            expectNotCalledWith(sendDebuggerCommand, 'Runtime.evaluate')
            expectCalledWith(sendDebuggerCommand, 'Page.bringToFront')
          })
        })

        describe('when not headless', () => {
          beforeEach(async () => {
            isHeadless = false
            cdpAutomation = await CdpAutomation.create(sendDebuggerCommand, onFn, offFn, sendCloseTargetCommand, automation, undefined, requireTabFocus, isHeadless)
            sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })
          })

          describe('and the extension activates the tab', () => {
            beforeEach(() => {
              sendDebuggerCommand.withArgs('Runtime.evaluate').resolves()
              sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })
            })

            it('captures the screenshot', async () => {
              await expect(cdpAutomation.onRequest('take:screenshot', undefined)).resolves.toBe('data:image/png;base64,foo')
            })
          })

          describe('and the extension fails to activate the tab', () => {
            beforeEach(() => {
              sendDebuggerCommand.withArgs('Runtime.evaluate').rejects(new Error('Unable to communicate with Cypress Extension'))
              sendDebuggerCommand.withArgs('Page.bringToFront').resolves()
            })

            it('captures the screenshot', async () => {
              await expect(cdpAutomation.onRequest('take:screenshot', undefined)).resolves.toBe('data:image/png;base64,foo')
            })
          })
        })
      })
    })

    describe('reset:browser:state', () => {
      it('sends Storage.clearDataForOrigin and Network.clearBrowserCache', async () => {
        sendDebuggerCommand.withArgs('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'cookies,indexeddb,local_storage,shader_cache,service_workers,cache_storage,interest_groups,shared_storage' }).resolves()
        sendDebuggerCommand.withArgs('Network.clearBrowserCache').resolves()

        await onRequest('reset:browser:state')

        expectCalledWith(sendDebuggerCommand, 'Storage.clearDataForOrigin', { origin: '*', storageTypes: 'cookies,indexeddb,local_storage,shader_cache,service_workers,cache_storage,interest_groups,shared_storage' })
        expectCalledWith(sendDebuggerCommand, 'Network.clearBrowserCache')
      })
    })

    describe('reset:browser:tabs:for:next:spec', () => {
      it('sends the close target message for the attached target tabs', async () => {
        sendCloseTargetCommand.mockResolvedValue(undefined)

        await onRequest('reset:browser:tabs:for:next:spec', { shouldKeepTabOpen: true })

        expectCalledWith(sendCloseTargetCommand, true)
      })
    })

    describe('focus:browser:window', () => {
      it('sends Page.bringToFront when focus is requested', () => {
        sendDebuggerCommand.withArgs('Page.bringToFront').resolves()

        return onRequest('focus:browser:window').then((resp) => expect(resp).toBeUndefined())
      })
    })

    describe('get:heap:size:limit', () => {
      it('sends Runtime.evaluate to request the performance.memory.jsHeapSizeLimit', async () => {
        sendDebuggerCommand.withArgs('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' }).resolves()

        return onRequest('get:heap:size:limit').then((resp) => expect(resp).toBeUndefined())
      })
    })

    describe('collect:garbage', () => {
      it('sends HeapProfiler.collectGarbage when garbage collection is requested', async () => {
        sendDebuggerCommand.withArgs('HeapProfiler.collectGarbage').resolves()

        return onRequest('collect:garbage').then((resp) => expect(resp).toBeUndefined())
      })
    })

    describe('get:aut:url', () => {
      it('gets the application url via CDP', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: 'Your project: foobar',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        sendDebuggerCommand.withArgs('Runtime.evaluate').resolves({
          result: {
            type: 'string',
            value: 'http://localhost:3500/fixtures/dom.html',
          },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('get:aut:url')

        expect(resp).toBe('http://localhost:3500/fixtures/dom.html')

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.location.href',
          contextId: 123,
        })
      })

      it('gets the application url after the AUT overwrites window.name', async () => {
        const client = {
          send: createStub(() => Promise.resolve({})),
          on: vi.fn(),
          off: vi.fn(),
        }

        client.send.withArgs('Page.getFrameTree').resolves({
          frameTree: {
            frame: { id: 'root', url: 'about:blank' },
            childFrames: [
              {
                frame: {
                  id: 'reporter',
                  name: REPORTER_FRAME_NAME,
                  url: 'about:blank',
                },
              },
              {
                frame: {
                  id: '1',
                  name: 'Your project: foobar',
                  url: 'about:blank',
                },
              },
            ],
          },
        })

        // the AUT frame is identified by name while it is still on the blank page
        await cdpAutomation.seedFrameTree(client as any)
        expect(await cdpAutomation.isAUTFrame('1')).toBe(true)

        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree: {
            frame: { id: 'root', url: 'about:blank' },
            childFrames: [
              {
                frame: {
                  id: 'reporter',
                  name: REPORTER_FRAME_NAME,
                  url: 'about:blank',
                },
              },
              {
                frame: {
                  id: '1',
                  name: 'application-window-123',
                  url: 'http://localhost:3500/fixtures/dom.html',
                },
              },
            ],
          },
        })

        sendDebuggerCommand.withArgs('Runtime.evaluate').resolves({
          result: {
            type: 'string',
            value: 'http://localhost:3500/fixtures/dom.html',
          },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        expect(await onRequest('get:aut:url')).toBe('http://localhost:3500/fixtures/dom.html')

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.location.href',
          contextId: 123,
        })
      })

      it('falls back to the only child frame the runner does not own', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree: {
            frame: { id: 'root', url: 'about:blank' },
            childFrames: [
              { frame: { id: 'reporter', name: REPORTER_FRAME_NAME, url: 'about:blank' } },
              { frame: { id: '1', name: '', url: 'http://localhost:3500/fixtures/dom.html' } },
              { frame: { id: 'snapshot-0', name: `${AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER} - 0: 'foobar'`, url: 'about:blank' } },
              { frame: { id: 'snapshot-1', name: `${AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER} - 1: 'foobar'`, url: 'about:blank' } },
              { frame: { id: 'spec', name: `${SPEC_FRAME_NAME_IDENTIFIER}: '/__cypress/iframes/spec.js'`, url: 'http://localhost:3500/__cypress/iframes/spec.js' } },
            ],
          },
        })

        sendDebuggerCommand.withArgs('Runtime.evaluate').resolves({
          result: {
            type: 'string',
            value: 'http://localhost:3500/fixtures/dom.html',
          },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        expect(await onRequest('get:aut:url')).toBe('http://localhost:3500/fixtures/dom.html')

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.location.href',
          contextId: 123,
        })
      })

      it('fails rather than picking a runner frame when the AUT frame is gone', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree: {
            frame: { id: 'root', url: 'about:blank' },
            childFrames: [
              { frame: { id: 'reporter', name: REPORTER_FRAME_NAME, url: 'about:blank' } },
              { frame: { id: 'snapshot-0', name: `${AUT_SNAPSHOT_FRAME_NAME_IDENTIFIER} - 0: 'foobar'`, url: 'about:blank' } },
              { frame: { id: 'spec', name: `${SPEC_FRAME_NAME_IDENTIFIER}: '/__cypress/iframes/spec.js'`, url: 'http://localhost:3500/__cypress/iframes/spec.js' } },
              { frame: { id: 'bridge', name: `${SPEC_BRIDGE_FRAME_NAME_IDENTIFIER}: http://localhost:3500`, url: 'http://localhost:3500/__cypress/spec-bridge-iframes' } },
            ],
          },
        })

        await expect(onRequest('get:aut:url')).rejects.toThrow('Could not find AUT frame')
      })

      it('fails silently if the frame cannot be found', async () => {
        await expect(onRequest('get:aut:url')).rejects.toThrow('Could not find AUT frame')
      })
    })

    describe('reload:aut:frame', () => {
      it('reloads the application', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: 'Your project: foobar',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('reload:aut:frame', { forceReload: false })

        expect(resp).toBeUndefined()

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.location.reload(false)',
          contextId: 123,
        })
      })

      it('reloads the application via the force option', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: 'Your project: foobar',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('reload:aut:frame', { forceReload: true })

        expect(resp).toBeUndefined()

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.location.reload(true)',
          contextId: 123,
        })
      })

      it('fails if the frame cannot be found', async () => {
        await expect(onRequest('reload:aut:frame', { forceReload: false })).rejects.toThrow('Could not find AUT frame')
      })
    })

    describe('navigate:aut:history', () => {
      it('navigates the AUT history', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: 'Your project: foobar',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('navigate:aut:history', { historyNumber: 1 })

        expect(resp).toBeUndefined()

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.history.go(1)',
          contextId: 123,
        })
      })

      it('fails if the frame cannot be found', async () => {
        await expect(onRequest('navigate:aut:history', { historyNumber: 1 })).rejects.toThrow('Could not find AUT frame')
      })
    })

    describe('get:aut:title', () => {
      it('is able to get the AUT title', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: 'Your project: foobar',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        sendDebuggerCommand.withArgs('Runtime.evaluate').resolves({
          result: {
            type: 'string',
            value: 'mock title',
          },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('get:aut:title')

        expect(resp).toBe('mock title')

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.document.title',
          contextId: 123,
        })
      })

      it('does not throw if the AUT frame cannot be found by name', async () => {
        sendDebuggerCommand.withArgs('Page.getFrameTree').resolves({
          frameTree:
            {
              childFrames: [
                {
                  frame: {
                    id: '1',
                    name: '123456789',
                    url: 'http://localhost:3500/fixtures/dom.html',
                  },
                },
              ],
            },
        })

        sendDebuggerCommand.withArgs('Runtime.evaluate').resolves({
          result: {
            type: 'string',
            value: 'mock title',
          },
        })

        // @ts-expect-error
        cdpAutomation.executionContexts.set(123, {
          auxData: {
            frameId: '1',
          },
        })

        const resp = await onRequest('get:aut:title')

        expect(resp).toBe('mock title')

        expectCalledWith(sendDebuggerCommand, 'Runtime.evaluate', {
          expression: 'window.document.title',
          contextId: 123,
        })
      })

      it('fails if the frame cannot be found', async () => {
        await expect(onRequest('get:aut:title')).rejects.toThrow('Could not find AUT frame')
      })
    })

    describe('isAUTFrame', () => {
      afterEach(() => {
        delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF
      })

      it('matches the top-level AUT child frame', async () => {
        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'aut-outer',
                name: 'Your project: foobar',
                url: 'http://localhost:3500/',
              },
            },
          ],
        }

        expect(await cdpAutomation.isAUTFrame('aut-outer')).toBe(true)
        expect(await cdpAutomation.isAUTFrame('other')).toBe(false)
      })

      it('matches the nested AUT frame under cy-in-cy', async () => {
        process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = '1'

        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'aut-outer',
                name: 'Your project: outer',
                url: 'http://localhost:3000/__/',
              },
              childFrames: [
                {
                  frame: {
                    id: 'aut-inner',
                    name: 'Your project: inner',
                    url: 'http://localhost:3500/',
                  },
                },
              ],
            },
          ],
        }

        expect(await cdpAutomation.isAUTFrame('aut-inner')).toBe(true)
        expect(await cdpAutomation.isAUTFrame('aut-outer')).toBe(false)
      })

      it('keeps matching the AUT frame after the AUT overwrites window.name', async () => {
        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'reporter',
                name: REPORTER_FRAME_NAME,
                url: 'about:blank',
              },
            },
            {
              frame: {
                id: 'aut',
                name: 'Your project: foobar',
                url: 'about:blank',
              },
            },
          ],
        }

        expect(await cdpAutomation.isAUTFrame('aut')).toBe(true)

        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'reporter',
                name: REPORTER_FRAME_NAME,
                url: 'about:blank',
              },
            },
            {
              frame: {
                id: 'aut',
                name: 'application-window-123',
                url: 'http://localhost:3500/',
              },
            },
          ],
        }

        expect(await cdpAutomation.isAUTFrame('aut')).toBe(true)
        expect(await cdpAutomation.isAUTFrame('reporter')).toBe(false)
      })

      it('stops matching the remembered AUT frame once it detaches', async () => {
        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'aut',
                name: 'Your project: foobar',
                url: 'about:blank',
              },
            },
          ],
        }

        expect(await cdpAutomation.isAUTFrame('aut')).toBe(true)

        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [],
        }

        expect(await cdpAutomation.isAUTFrame('aut')).toBe(false)
      })
    })

    describe('onAUTFrameNavigated', () => {
      it('notifies subscribers with the committed URL for AUT frame navigations only', async () => {
        // @ts-expect-error - private cache used by _isAUTFrame
        cdpAutomation.frameTree = {
          frame: { id: 'root', url: 'about:blank' },
          childFrames: [
            {
              frame: {
                id: 'aut-outer',
                name: 'Your project: foobar',
                url: 'http://localhost:3500/',
              },
            },
          ],
        }

        const client = {
          send: createStub(() => Promise.resolve({})),
          on: vi.fn(),
          off: vi.fn(),
        }

        cdpAutomation._listenForFrameTreeChanges(client as any)

        const onFrameNavigated = callsWith(client.on, 'Page.frameNavigated')[0][1]
        const listener = vi.fn()
        const unsubscribe = cdpAutomation.onAUTFrameNavigated(listener)

        onFrameNavigated({ frame: { id: 'other-frame', url: 'https://other.test/' } })
        onFrameNavigated({ frame: { id: 'aut-outer', url: 'https://app.test/dashboard' } })

        await Promise.resolve()
        await Promise.resolve()

        expect(listener).toHaveBeenCalledOnce()
        expectCalledWith(listener, 'https://app.test/dashboard')

        unsubscribe()
        onFrameNavigated({ frame: { id: 'aut-outer', url: 'https://app.test/next' } })

        await Promise.resolve()
        await Promise.resolve()

        expect(listener).toHaveBeenCalledOnce()
      })
    })
  })
})
