import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import os from 'os'
import type { Mock } from 'vitest'
import type { AppCaptureProtocolInterface, ProtocolManagerShape } from '@packages/types'
import { EventEmitter } from 'stream'
import esbuild from 'esbuild'
import fs from 'fs-extra'
import _ from 'lodash'
import { ProtocolManager, DB_SIZE_LIMIT, DEFAULT_STREAM_SAMPLING_INTERVAL } from '../../../lib/cloud/protocol'

const { mockDb, mockDatabase, mockPutProtocolArtifact } = vi.hoisted(() => {
  const mockDb = vi.fn()

  return {
    mockDb,
    mockDatabase: vi.fn(() => mockDb),
    mockPutProtocolArtifact: vi.fn(),
  }
})

vi.mock('better-sqlite3', () => ({ default: mockDatabase }))

vi.mock('../../../lib/cloud/api/put_protocol_artifact', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/cloud/api/put_protocol_artifact')>()

  return { ...actual, putProtocolArtifact: mockPutProtocolArtifact }
})

const stubPutProtocolArtifact = (expectedArgs: unknown[], result: () => Promise<void>) => {
  mockPutProtocolArtifact.mockImplementation((...args) => (_.isEqual(args, expectedArgs) ? result() : undefined))
}

class TestClient extends EventEmitter {
  send: Mock = vi.fn()
}

const { outputFiles: [{ contents: stubProtocolRaw }] } = esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'protocol', 'test-protocol.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
})
const stubProtocol = new TextDecoder('utf-8').decode(stubProtocolRaw)

describe('lib/cloud/protocol', () => {
  let protocolManager: ProtocolManagerShape
  let protocol: AppCaptureProtocolInterface

  beforeEach(async () => {
    protocolManager = new ProtocolManager()

    await protocolManager.prepareAndSetupProtocol(stubProtocol, {
      runId: '1',
      testingType: 'e2e',
      projectId: '1',
      cloudApi: { url: 'http://localhost:1234', retryWithBackoff: async () => {}, requestPromise: { get: async () => {} } },
      projectConfig: {
        devServerPublicPathRoute: '/__cypress-app/src',
        namespace: '__cypress-app',
        port: 1234,
        proxyUrl: 'http://localhost:1234',
      },
      mode: 'record',
    })

    protocol = (protocolManager as any)._protocol
    expect((protocol as any)).not.toBeUndefined()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    mockDatabase.mockClear()
    mockPutProtocolArtifact.mockReset()
  })

  it('should be able to connect to the browser', async () => {
    const mockCdpClient = new TestClient()

    const connectToBrowserStub = vi.spyOn(protocol, 'connectToBrowser').mockResolvedValue(undefined)

    await protocolManager.connectToBrowser(mockCdpClient as any)

    const newCdpClient = connectToBrowserStub.mock.calls[0][0]

    newCdpClient.send('Page.enable')
    expect(mockCdpClient.send).toHaveBeenCalledWith('Page.enable')

    const mockSuccess = vi.fn()

    newCdpClient.on('Page.loadEventFired', mockSuccess)

    const mockThrows = vi.fn(() => {
      throw new Error()
    })

    newCdpClient.on('Page.backForwardCacheNotUsed', mockThrows)

    mockCdpClient.emit('Page.loadEventFired')

    expect(mockSuccess).toHaveBeenCalled()
    expect((protocolManager as any)._errors).toHaveLength(0)

    mockCdpClient.emit('Page.backForwardCacheNotUsed', { test: 'test1' })

    expect(mockThrows).toHaveBeenCalled()
    expect((protocolManager as any)._errors).toHaveLength(1)
    expect((protocolManager as any)._errors[0].captureMethod).toBe('cdpClient.on')
    expect((protocolManager as any)._errors[0].args).toEqual([
      'Page.backForwardCacheNotUsed',
      {
        test: 'test1',
      },
    ])
  })

  it('should unregister listener when off() is called on wrapped CDP client', async () => {
    const mockCdpClient = new TestClient()

    vi.spyOn(protocol, 'connectToBrowser').mockResolvedValue(undefined)

    await protocolManager.connectToBrowser(mockCdpClient as any)

    const newCdpClient = vi.mocked(protocol.connectToBrowser).mock.calls[0][0] as any
    const listener = vi.fn()

    newCdpClient.on('Page.loadEventFired', listener)
    mockCdpClient.emit('Page.loadEventFired')
    expect(listener).toHaveBeenCalledOnce()

    newCdpClient.off('Page.loadEventFired', listener)
    mockCdpClient.emit('Page.loadEventFired')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('uses event+listener composite key so same listener on multiple events does not leak wrappers', async () => {
    const mockCdpClient = new TestClient()
    const onCalls: Array<{ event: string, listener: Function }> = []
    const offCalls: Array<{ event: string, listener: Function }> = []

    const originalOn = mockCdpClient.on.bind(mockCdpClient)
    const originalOff = mockCdpClient.off.bind(mockCdpClient)

    mockCdpClient.on = function (event: string, listener: Function) {
      onCalls.push({ event, listener })

      return originalOn(event, listener)
    }

    mockCdpClient.off = function (event: string, listener: Function) {
      offCalls.push({ event, listener })

      return originalOff(event, listener)
    }

    let capturedWrappedClient: any

    vi.spyOn(protocolManager as any, 'invokeAsync').mockImplementation(async (_method: string, _opts: any, cdpClient: any) => {
      capturedWrappedClient = cdpClient
    })

    await protocolManager.connectToBrowser(mockCdpClient as any)

    expect(capturedWrappedClient).toBeDefined()

    const sharedListener = vi.fn()

    capturedWrappedClient.on('Page.frameAttached', sharedListener)
    capturedWrappedClient.on('Page.frameDetached', sharedListener)

    expect(onCalls).toHaveLength(2)

    const wrapperForAttached = onCalls.find((c) => c.event === 'Page.frameAttached')!.listener
    const wrapperForDetached = onCalls.find((c) => c.event === 'Page.frameDetached')!.listener

    expect(wrapperForAttached).not.toBe(wrapperForDetached)

    capturedWrappedClient.off('Page.frameAttached', sharedListener)
    expect(offCalls).toHaveLength(1)
    expect(offCalls[0].event).toBe('Page.frameAttached')
    expect(offCalls[0].listener).toBe(wrapperForAttached)

    capturedWrappedClient.off('Page.frameDetached', sharedListener)
    expect(offCalls).toHaveLength(2)
    expect(offCalls[1].event).toBe('Page.frameDetached')
    expect(offCalls[1].listener).toBe(wrapperForDetached)
  })

  it('should call cleanup on existing protocol when setupProtocol is called again', () => {
    const cleanupStub = vi.spyOn(protocol, 'cleanup').mockImplementation(() => {})

    protocolManager.setupProtocol()

    expect(cleanupStub).toHaveBeenCalledOnce()
  })

  it('should be able to initialize a new spec', () => {
    vi.spyOn(protocol, 'beforeSpec').mockImplementation(() => {})

    ;(protocolManager as any)._errors = [
      {
        captureMethod: 'cdpClient.on',
      },
    ]

    const spec = {
      instanceId: 'instanceId',
      absolute: '/path/to/spec',
      relative: 'spec',
      relativeToCommonRoot: 'common/root',
      specFileExtension: '.ts',
      fileExtension: '.ts',
      specType: 'integration' as Cypress.CypressSpecType,
      baseName: 'spec',
      name: 'spec',
      fileName: 'spec.ts',
    }

    protocolManager.beforeSpec(spec)

    expect((protocolManager as any)._errors).toHaveLength(0)

    expect(protocol.beforeSpec).toHaveBeenCalledWith({
      workingDirectory: path.join(os.tmpdir(), 'cypress', 'protocol'),
      archivePath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.tar'),
      dbPath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'),
      db: mockDb,
      spec,
    })

    expect(mockDatabase).toHaveBeenCalledWith(path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'), {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: expect.any(Function),
    })

    expect(protocolManager['_instanceId']).toBe('instanceId')
    expect(protocolManager['_specName']).toBe('spec')
  })

  it('should be able to initialize a new test', async () => {
    vi.spyOn(protocol, 'beforeTest').mockImplementation(() => {})

    await protocolManager.beforeTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.beforeTest).toHaveBeenCalledWith({
      id: 'id',
      title: 'test',
    })
  })

  describe('.afterSpec', () => {
    it('invokes the protocol manager afterSpec fn', async () => {
      vi.spyOn(protocol, 'afterSpec').mockImplementation(() => {})

      await protocolManager.afterSpec()

      expect(protocol.afterSpec).toHaveBeenCalled()
    })
  })

  it('should be able to handle pre-after test', async () => {
    vi.spyOn(protocol, 'preAfterTest').mockImplementation(() => {})

    await protocolManager.preAfterTest({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })

    expect(protocol.preAfterTest).toHaveBeenCalledWith({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })
  })

  it('should be able to clean up after a test', async () => {
    vi.spyOn(protocol, 'afterTest').mockImplementation(() => {})

    await protocolManager.afterTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.afterTest).toHaveBeenCalledWith({
      id: 'id',
      title: 'test',
    })
  })

  it('should be able to add runnables', () => {
    vi.spyOn(protocol, 'addRunnables').mockImplementation(() => {})

    const rootRunnable = {
      id: 'r1',
      type: 'suite',
      suites: [],
      tests: [
        {
          id: 'r2',
          name: 'test body',
          title: 'test 1',
          type: 'test',
        },
      ],
      hooks: [],
    }

    protocolManager.addRunnables(rootRunnable)

    expect(protocol.addRunnables).toHaveBeenCalledWith(rootRunnable)
  })

  it('should be able to add a command log', () => {
    vi.spyOn(protocol, 'commandLogAdded').mockImplementation(() => {})

    const log = {
      id: 'log-https://example.cypress.io-17',
      alias: 'getComment',
      aliasType: 'route',
      displayName: 'xhr',
      event: true,
      hookId: 'r4',
      instrument: 'command',
      message: '',
      method: 'GET',
      name: 'request',
      renderProps: {},
      state: 'pending',
      testId: 'r4',
      timeout: 0,
      createdAtTimestamp: 1689619127850.2854,
      updatedAtTimestamp: 1689619127851.2854,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogAdded(log)

    expect(protocol.commandLogAdded).toHaveBeenCalledWith(log)
  })

  it('should be able to change a command log', () => {
    vi.spyOn(protocol, 'commandLogChanged').mockImplementation(() => {})

    const log = {
      id: 'log-https://example.cypress.io-17',
      alias: 'getComment',
      aliasType: 'route',
      displayName: 'xhr',
      event: true,
      hookId: 'r4',
      instrument: 'command',
      message: '',
      method: 'GET',
      name: 'request',
      renderProps: {},
      state: 'pending',
      testId: 'r4',
      timeout: 0,
      createdAtTimestamp: 1689619127850.2854,
      updatedAtTimestamp: 1689619127851.2854,
      type: 'parent',
      url: 'https://jsonplaceholder.cypress.io/comments/1',
      wallClockStartedAt: '2023-03-30T21:58:08.456Z',
      testCurrentRetry: 0,
      hasSnapshot: false,
      hasConsoleProps: true,
    }

    protocolManager.commandLogChanged(log)

    expect(protocol.commandLogChanged).toHaveBeenCalledWith(log)
  })

  it('should be able to handle changing the viewport', () => {
    vi.spyOn(protocol, 'viewportChanged').mockImplementation(() => {})

    const input = {
      viewport: {
        width: 100,
        height: 200,
      },
      timestamp: 1234,
    }

    protocolManager.viewportChanged(input)

    expect(protocol.viewportChanged).toHaveBeenCalledWith(input)
  })

  it('should be able to handle changing the url', () => {
    vi.spyOn(protocol, 'urlChanged').mockImplementation(() => {})

    const input = {
      url: 'https://example.cypress.io',
      timestamp: 1234,
    }

    protocolManager.urlChanged(input)

    expect(protocol.urlChanged).toHaveBeenCalledWith(input)
  })

  it('should be able to handle the page loading', () => {
    vi.spyOn(protocol, 'pageLoading').mockImplementation(() => {})

    const input = {
      loading: true,
      timestamp: 1234,
    }

    protocolManager.pageLoading(input)

    expect(protocol.pageLoading).toHaveBeenCalledWith(input)
  })

  describe('.resetTest', () => {
    it('should be able to reset the test with no current retry', () => {
      vi.spyOn(protocol, 'resetTest').mockImplementation(() => {})

      const testId = 'r3'

      protocolManager.resetTest(testId)

      expect(protocol.resetTest).toHaveBeenCalledWith(testId, undefined)
    })

    it('should be able to reset the test with a current retry', () => {
      vi.spyOn(protocol, 'resetTest').mockImplementation(() => {})

      const testId = 'r3'
      const currentRetry = 1

      protocolManager.resetTest(testId, currentRetry)

      expect(protocol.resetTest).toHaveBeenCalledWith(testId, currentRetry)
    })
  })

  // the Cloud ships the protocol as a class instance whose methods rely on `this`
  describe('invocation receiver', () => {
    it('invokes a synchronous method on the protocol instance', () => {
      vi.spyOn(protocol, 'resetTest').mockImplementation(() => {})

      protocolManager.resetTest('r3', 1)

      expect(vi.mocked(protocol.resetTest).mock.contexts).toContain(protocol)
    })

    it('invokes an asynchronous method on the protocol instance', async () => {
      vi.spyOn(protocol, 'preAfterTest').mockResolvedValue(undefined)

      await protocolManager.preAfterTest({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })

      expect(vi.mocked(protocol.preAfterTest).mock.contexts).toContain(protocol)
    })

    it('forwards no arguments when the caller supplies none', () => {
      const cleanup = vi.spyOn(protocol, 'cleanup').mockImplementation(() => {})

      protocolManager.cleanup()

      expect(cleanup.mock.contexts).toContain(protocol)
      expect(cleanup.mock.calls[0]).toEqual([])
    })
  })

  describe('.reset', () => {
    it('closes the protocol manager', () => {
      const mockClose = vi.fn()

      protocolManager['_db'] = {
        close: mockClose,
      }

      protocolManager['_dbPath'] = '/path/to/db'
      vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)
      protocolManager['_archivePath'] = '/path/to/archive'
      protocolManager['_instanceId'] = 'abc123'
      protocolManager['_runId'] = '1'
      protocolManager['_errors'] = [{ captureMethod: 'cdpClient.on' }]

      protocolManager.close()

      expect(mockClose).toHaveBeenCalled()
      expect(protocolManager['_db']).toBeUndefined()
      expect(protocolManager['_dbPath']).toBeUndefined()
      expect(fs.unlink).toHaveBeenCalledWith('/path/to/db')
      expect(protocolManager['_archivePath']).toBeUndefined()
      expect(fs.unlink).toHaveBeenCalledWith('/path/to/archive')
      expect(protocolManager['_instanceId']).toBeUndefined()
      expect(protocolManager['_runId']).toBeUndefined()
      expect(protocolManager['_errors']).toHaveLength(0)
      expect(protocolManager['_protocol']).toBeUndefined()
    })

    it('calls cleanup on protocol before clearing it', () => {
      const cleanupStub = vi.spyOn(protocol, 'cleanup').mockImplementation(() => {})

      protocolManager['_db'] = { close: vi.fn() }
      protocolManager['_dbPath'] = '/path/to/db'
      protocolManager['_archivePath'] = '/path/to/archive'
      vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

      protocolManager.close()

      expect(cleanupStub).toHaveBeenCalledOnce()
      expect(protocolManager['_protocol']).toBeUndefined()
    })
  })

  describe('.dbPath', () => {
    it('returns the database path', () => {
      const mockDbPath = '/path/to/db'

      protocolManager['_dbPath'] = mockDbPath

      expect(protocolManager.dbPath).toBe(mockDbPath)
    })

    it('returns undefined when no database path is set', () => {
      expect(protocolManager.dbPath).toBeUndefined()
    })
  })

  describe('.uploadCaptureArtifact()', () => {
    let filePath: string
    let fileSize: number
    let uploadUrl: string
    let expectedAfterSpecTotal: number
    let offset: number
    let size: number
    let instanceId: string

    describe('when protocol is initialized, and spec has finished', () => {
      const expectedAfterSpecDurations = {
        durations: {
          drainCDPEvents: 1,
          drainAUTEvents: 5,
          resolveBodyPromises: 7,
          closeDb: 11,
          teardownBindings: 13,
        },
      }

      beforeEach(async () => {
        filePath = '/foo/bar'
        fileSize = 1000
        uploadUrl = 'http://fake.test/upload_url'
        offset = 10
        size = 100
        instanceId = 'abc123'

        vi.spyOn(protocol, 'getDbMetadata').mockReturnValue({ offset, size })
        vi.spyOn(fs, 'unlink').mockImplementation(((p) => (p === filePath ? Promise.resolve() : undefined)) as any)
        protocolManager.beforeSpec({ instanceId, absolute: '/path/to/spec', relative: 'spec', specFileExtension: '.ts', fileExtension: '.ts', specType: 'integration', baseName: 'spec', name: 'spec', fileName: 'spec.ts' })

        expectedAfterSpecTotal = 225

        vi.useFakeTimers()
        vi.spyOn(performance, 'timeOrigin', 'get').mockReturnValue(0)
        vi.spyOn(protocol, 'afterSpec').mockImplementation(async () => {
          await vi.advanceTimersByTimeAsync(expectedAfterSpecTotal)

          return expectedAfterSpecDurations
        })

        await protocolManager.afterSpec()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      describe('when upload succeeds', () => {
        let defaultInterval

        beforeEach(() => {
          defaultInterval = DEFAULT_STREAM_SAMPLING_INTERVAL
        })

        describe('with default sampling rate', () => {
          beforeEach(() => {
            stubPutProtocolArtifact([filePath, DB_SIZE_LIMIT, uploadUrl, defaultInterval], () => Promise.resolve())
          })

          it('uses 5000ms as the default stream monitoring sample rate', async () => {
            await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })

            expect(mockPutProtocolArtifact).toHaveBeenCalledWith(filePath, DB_SIZE_LIMIT, uploadUrl, defaultInterval)
          })

          it('unlinks the db & returns fileSize, afterSpec durations, success=true, and the db metadata', async () => {
            const res = await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })

            expect(res).not.toBeUndefined()
            expect(res).toMatchObject({
              fileSize,
              success: true,
            })

            expect(res?.afterSpecDurations).toMatchObject({
              afterSpecTotal: expectedAfterSpecTotal,
              ...expectedAfterSpecDurations.durations,
            })

            // @ts-ignore
            expect(res?.specAccess.offset).toBe(offset)
            // @ts-ignore
            expect(res?.specAccess.size).toBe(size)

            expect(fs.unlink).toHaveBeenCalled()
          })
        })

        describe('when protocol exports a sampling rate', () => {
          let appCaptureProtocolInterval

          beforeEach(() => {
            appCaptureProtocolInterval = 7500

            protocol.uploadStallSamplingInterval = vi.fn(() => {
              return appCaptureProtocolInterval
            })
          })

          afterEach(() => {
            // @ts-ignore
            protocol.uploadStallSamplingInterval = undefined
          })

          it('uses the sampling rate defined by protocol', async () => {
            stubPutProtocolArtifact([filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval], () => Promise.resolve())
            await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            expect(mockPutProtocolArtifact).toHaveBeenCalledWith(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval)
          })

          describe('and the user specifies a sampling rate env var', () => {
            let userDefinedInterval

            beforeEach(() => {
              userDefinedInterval = 10000
              vi.stubEnv('CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL', '10000')
            })

            afterEach(() => {
              vi.unstubAllEnvs()
            })

            it('uses the override value from the env var', async () => {
              stubPutProtocolArtifact([filePath, DB_SIZE_LIMIT, uploadUrl, userDefinedInterval], () => Promise.resolve())
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
              expect(mockPutProtocolArtifact).toHaveBeenCalledWith(filePath, DB_SIZE_LIMIT, uploadUrl, userDefinedInterval)
            })
          })

          describe('and the user specifies a sampling rate env var that parses to NaN', () => {
            beforeEach(() => {
              vi.stubEnv('CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL', 'not-a-number')
            })

            afterEach(() => {
              vi.unstubAllEnvs()
            })

            it('uses the value from app capture protocol', async () => {
              stubPutProtocolArtifact([filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval], () => Promise.resolve())
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
              expect(mockPutProtocolArtifact).toHaveBeenCalledWith(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval)
            })
          })
        })
      })

      describe('when upload fails', () => {
        let err

        beforeEach(() => {
          err = new Error()

          stubPutProtocolArtifact([filePath, DB_SIZE_LIMIT, uploadUrl, DEFAULT_STREAM_SAMPLING_INTERVAL], () => Promise.reject(err))
        })

        describe('and there is no local protocol path in env', () => {
          beforeEach(() => {
            vi.stubEnv('CYPRESS_LOCAL_PROTOCOL_PATH', undefined)
          })

          afterEach(() => {
            vi.unstubAllEnvs()
          })

          it('unlinks the db & rethrows the error', async () => {
            let threw = false

            try {
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            } catch (e) {
              threw = true
              expect(e).toBe(err)
            }
            expect(threw).toBe(true)
            expect(fs.unlink).toHaveBeenCalled()
          })
        })

        describe('and process.env.CYPRESS_LOCAL_PROTOCOL_PATH is truthy', () => {
          beforeEach(() => {
            vi.stubEnv('CYPRESS_LOCAL_PROTOCOL_PATH', '/path')
          })

          afterEach(() => {
            vi.unstubAllEnvs()
          })

          it('unlinks the db and does not rethrow', async () => {
            let threw = false

            try {
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            } catch (e) {
              threw = true
            }
            expect(threw).toBe(false)
            expect(fs.unlink).toHaveBeenCalled()
          })
        })
      })
    })
  })

  describe('.captureError', () => {
    beforeEach(() => {
      vi.spyOn(protocolManager as any, 'dispatchErrors').mockResolvedValue(undefined)
    })

    describe('when mode is `record`', () => {
      beforeEach(() => {
        protocolManager['options']['mode'] = 'record'
      })

      it('should store error into array for later reporting', () => {
        const err = { captureMethod: 'cdpClient.on', error: new Error(), args: { test: 'test1' } }

        protocolManager['captureError'](err)

        expect(protocolManager['_errors']).toHaveLength(1)
        expect(protocolManager['_errors'][0]).toMatchObject(err)
        expect(protocolManager['dispatchErrors']).not.toHaveBeenCalled()
      })
    })

    describe('when mode is `studio`', () => {
      beforeEach(() => {
        protocolManager['options']['mode'] = 'studio'
      })

      it('should immediately dispatch errors to the cloud', () => {
        const err = { captureMethod: 'cdpClient.on', error: new Error(), args: { test: 'test1' } }

        protocolManager['captureError'](err)

        expect(protocolManager['_errors']).toHaveLength(0)
        expect(protocolManager['dispatchErrors']).toHaveBeenCalled()
        expect(protocolManager['dispatchErrors'].mock.calls[0][0]).toEqual([err])
        expect(protocolManager['dispatchErrors'].mock.calls[0][1]).toEqual({
          osName: os.platform(),
          projectSlug: protocolManager['options']['projectId'],
          specName: protocolManager['_specName'],
          mode: 'studio',
        })
      })
    })
  })
})
