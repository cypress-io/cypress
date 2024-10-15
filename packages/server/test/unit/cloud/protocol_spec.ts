import { proxyquire, sinon } from '../../spec_helper'
import path from 'path'
import os from 'os'
import type { AppCaptureProtocolInterface, ProtocolManagerShape } from '@packages/types'
import { expect } from 'chai'
import { EventEmitter } from 'stream'
import esbuild from 'esbuild'
import fs from 'fs-extra'
import type { SinonStub } from 'sinon'

class TestClient extends EventEmitter {
  send: sinon.SinonStub = sinon.stub()
}

const mockDb = sinon.stub()
const mockDatabase = sinon.stub().returns(mockDb)
const mockPutProtocolArtifact = sinon.stub()

const { ProtocolManager, DB_SIZE_LIMIT, DEFAULT_STREAM_SAMPLING_INTERVAL } = proxyquire('../lib/cloud/protocol', {
  'better-sqlite3': mockDatabase,
  './api/put_protocol_artifact': { putProtocolArtifact: mockPutProtocolArtifact },
}) as typeof import('@packages/server/lib/cloud/protocol')

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

    await protocolManager.setupProtocol(stubProtocol, { runId: '1', testingType: 'e2e' })

    protocol = (protocolManager as any)._protocol
    expect((protocol as any)).not.to.be.undefined
  })

  it('should be able to connect to the browser', async () => {
    const mockCdpClient = new TestClient()

    const connectToBrowserStub = sinon.stub(protocol, 'connectToBrowser').resolves()

    await protocolManager.connectToBrowser(mockCdpClient as any)

    const newCdpClient = connectToBrowserStub.getCall(0).args[0]

    newCdpClient.send('Page.enable')
    expect(mockCdpClient.send).to.be.calledWith('Page.enable')

    const mockSuccess = sinon.stub()

    newCdpClient.on('Page.loadEventFired', mockSuccess)

    const mockThrows = sinon.stub().throws()

    newCdpClient.on('Page.backForwardCacheNotUsed', mockThrows)

    mockCdpClient.emit('Page.loadEventFired')

    expect(mockSuccess).to.be.called
    expect((protocolManager as any)._errors).to.be.empty

    mockCdpClient.emit('Page.backForwardCacheNotUsed', { test: 'test1' })

    expect(mockThrows).to.be.called
    expect((protocolManager as any)._errors).to.have.length(1)
    expect((protocolManager as any)._errors[0].captureMethod).to.equal('cdpClient.on')
    expect((protocolManager as any)._errors[0].args).to.deep.equal([
      'Page.backForwardCacheNotUsed',
      {
        test: 'test1',
      },
    ])
  })

  it('should be able to initialize a new spec', () => {
    sinon.stub(protocol, 'beforeSpec')

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

    expect((protocolManager as any)._errors).to.be.empty

    expect(protocol.beforeSpec).to.be.calledWith({
      workingDirectory: path.join(os.tmpdir(), 'cypress', 'protocol'),
      archivePath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.tar'),
      dbPath: path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'),
      db: mockDb,
      spec,
    })

    expect(mockDatabase).to.be.calledWith(path.join(os.tmpdir(), 'cypress', 'protocol', 'instanceId.db'), {
      nativeBinding: path.join(require.resolve('better-sqlite3/build/Release/better_sqlite3.node')),
      verbose: sinon.match.func,
    })
  })

  it('should be able to initialize a new test', async () => {
    sinon.stub(protocol, 'beforeTest')

    await protocolManager.beforeTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.beforeTest).to.be.calledWith({
      id: 'id',
      title: 'test',
    })
  })

  describe('.afterSpec', () => {
    it('invokes the protocol manager afterSpec fn', async () => {
      sinon.stub(protocol, 'afterSpec')

      await protocolManager.afterSpec()

      expect(protocol.afterSpec).to.be.called
    })
  })

  it('should be able to handle pre-after test', async () => {
    sinon.stub(protocol, 'preAfterTest')

    await protocolManager.preAfterTest({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })

    expect(protocol.preAfterTest).to.be.calledWith({ id: 'id', title: 'test' }, { nextTestHasTestIsolationOn: true })
  })

  it('should be able to clean up after a test', async () => {
    sinon.stub(protocol, 'afterTest')

    await protocolManager.afterTest({
      id: 'id',
      title: 'test',
    })

    expect(protocol.afterTest).to.be.calledWith({
      id: 'id',
      title: 'test',
    })
  })

  it('should be able to add runnables', () => {
    sinon.stub(protocol, 'addRunnables')

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

    expect(protocol.addRunnables).to.be.calledWith(rootRunnable)
  })

  it('should be able to add a command log', () => {
    sinon.stub(protocol, 'commandLogAdded')

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

    expect(protocol.commandLogAdded).to.be.calledWith(log)
  })

  it('should be able to change a command log', () => {
    sinon.stub(protocol, 'commandLogChanged')

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

    expect(protocol.commandLogChanged).to.be.calledWith(log)
  })

  it('should be able to handle changing the viewport', () => {
    sinon.stub(protocol, 'viewportChanged')

    const input = {
      viewport: {
        width: 100,
        height: 200,
      },
      timestamp: 1234,
    }

    protocolManager.viewportChanged(input)

    expect(protocol.viewportChanged).to.be.calledWith(input)
  })

  it('should be able to handle changing the url', () => {
    sinon.stub(protocol, 'urlChanged')

    const input = {
      url: 'https://example.cypress.io',
      timestamp: 1234,
    }

    protocolManager.urlChanged(input)

    expect(protocol.urlChanged).to.be.calledWith(input)
  })

  it('should be able to handle the page loading', () => {
    sinon.stub(protocol, 'pageLoading')

    const input = {
      loading: true,
      timestamp: 1234,
    }

    protocolManager.pageLoading(input)

    expect(protocol.pageLoading).to.be.calledWith(input)
  })

  it('should be able to reset the test', () => {
    sinon.stub(protocol, 'resetTest')

    const testId = 'r3'

    protocolManager.resetTest(testId)

    expect(protocol.resetTest).to.be.calledWith(testId)
  })

  describe('.uploadCaptureArtifact()', () => {
    let filePath: string
    let fileSize: number
    let uploadUrl: string
    let expectedAfterSpecTotal: number
    let offset: number
    let size: number
    let instanceId: string
    let clock

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

        sinon.stub(protocol, 'getDbMetadata').returns({ offset, size })
        sinon.stub(fs, 'unlink').withArgs(filePath).resolves()
        protocolManager.beforeSpec({ instanceId })

        expectedAfterSpecTotal = 225

        clock = sinon.useFakeTimers()
        sinon.stub(performance, 'timeOrigin').value(0)
        sinon.stub(protocol, 'afterSpec').callsFake(async () => {
          await clock.tickAsync(expectedAfterSpecTotal)

          return expectedAfterSpecDurations
        })

        await protocolManager.afterSpec()
      })

      afterEach(() => {
        clock.restore()
      })

      describe('when upload succeeds', () => {
        let defaultInterval

        beforeEach(() => {
          defaultInterval = DEFAULT_STREAM_SAMPLING_INTERVAL
        })

        describe('with default sampling rate', () => {
          beforeEach(() => {
            mockPutProtocolArtifact.withArgs(filePath, DB_SIZE_LIMIT, uploadUrl, defaultInterval).resolves()
          })

          it('uses 5000ms as the default stream monitoring sample rate', async () => {
            await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })

            expect(mockPutProtocolArtifact).to.have.been.calledWith(filePath, DB_SIZE_LIMIT, uploadUrl, defaultInterval)
          })

          it('unlinks the db & returns fileSize, afterSpec durations, success=true, and the db metadata', async () => {
            const res = await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })

            expect(res).not.to.be.undefined
            expect(res).to.include({
              fileSize,
              success: true,
            })

            expect(res?.afterSpecDurations).to.include({
              afterSpecTotal: expectedAfterSpecTotal,
              ...expectedAfterSpecDurations.durations,
            })

            // @ts-ignore
            expect(res?.specAccess.offset).to.eq(offset)
            // @ts-ignore
            expect(res?.specAccess.size).to.eq(size)

            expect(fs.unlink).to.have.been.called
          })
        })

        describe('when protocol exports a sampling rate', () => {
          let appCaptureProtocolInterval

          beforeEach(() => {
            appCaptureProtocolInterval = 7500

            protocol.uploadStallSamplingInterval = sinon.stub().callsFake(() => {
              return appCaptureProtocolInterval
            })
          })

          afterEach(() => {
            // @ts-ignore
            protocol.uploadStallSamplingInterval = undefined
          })

          it('uses the sampling rate defined by protocol', async () => {
            mockPutProtocolArtifact.withArgs(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval).resolves()
            await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            expect(mockPutProtocolArtifact).to.have.been.calledWith(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval)
          })

          describe('and the user specifies a sampling rate env var', () => {
            let userDefinedInterval

            beforeEach(() => {
              userDefinedInterval = 10000
              process.env.CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL = '10000'
            })

            afterEach(() => {
              process.env.CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL = undefined
            })

            it('uses the override value from the env var', async () => {
              mockPutProtocolArtifact.withArgs(filePath, DB_SIZE_LIMIT, uploadUrl, userDefinedInterval).resolves()
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
              expect(mockPutProtocolArtifact).to.have.been.calledWith(filePath, DB_SIZE_LIMIT, uploadUrl, userDefinedInterval)
            })
          })

          describe('and the user specifies a sampling rate env var that parses to NaN', () => {
            beforeEach(() => {
              process.env.CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL = 'not-a-number'
            })

            afterEach(() => {
              process.env.CYPRESS_TEST_REPLAY_UPLOAD_SAMPLING_INTERVAL = undefined
            })

            it('uses the value from app capture protocol', async () => {
              mockPutProtocolArtifact.withArgs(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval).resolves()
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
              expect(mockPutProtocolArtifact).to.have.been.calledWith(filePath, DB_SIZE_LIMIT, uploadUrl, appCaptureProtocolInterval)
            })
          })
        })
      })

      describe('when upload fails', () => {
        let err

        beforeEach(() => {
          err = new Error()

          ;(mockPutProtocolArtifact as SinonStub).withArgs(filePath, DB_SIZE_LIMIT, uploadUrl, DEFAULT_STREAM_SAMPLING_INTERVAL).rejects(err)
        })

        describe('and there is no local protocol path in env', () => {
          let prevLocalProtocolPath

          beforeEach(() => {
            prevLocalProtocolPath = process.env.CYPRESS_LOCAL_PROTOCOL_PATH
            process.env.CYPRESS_LOCAL_PROTOCOL_PATH = undefined
          })

          afterEach(() => {
            process.env.CYPRESS_LOCAL_PROTOCOL_PATH = prevLocalProtocolPath
          })

          it('unlinks the db & rethrows the error', async () => {
            let threw = false

            try {
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            } catch (e) {
              threw = true
              expect(e).to.eq(err)
            }
            expect(threw).to.be.true
            expect(fs.unlink).to.be.called
          })
        })

        describe('and process.env.CYPRESS_LOCAL_PROTOCOL_PATH is truthy', () => {
          let prevLocalProtocolPath

          beforeEach(() => {
            prevLocalProtocolPath = process.env.CYPRESS_LOCAL_PROTOCOL_PATH
            process.env.CYPRESS_LOCAL_PROTOCOL_PATH = '/path'
          })

          afterEach(() => {
            process.env.CYPRESS_LOCAL_PROTOCOL_PATH = prevLocalProtocolPath
          })

          it('unlinks the db and does not rethrow', async () => {
            let threw = false

            try {
              await protocolManager.uploadCaptureArtifact({ uploadUrl, filePath, fileSize })
            } catch (e) {
              threw = true
            }
            expect(threw).to.be.false
            expect(fs.unlink).to.be.called
          })
        })
      })
    })
  })
})
