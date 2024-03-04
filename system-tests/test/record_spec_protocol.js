/* eslint-disable no-console */
const path = require('path')

const systemTests = require('../lib/system-tests').default
const { fs } = require('@packages/server/lib/util/fs')
const { promises: fsPromise } = require('fs')
const os = require('os')

const {
  createRoutes,
  setupStubbedServer,
  enableCaptureProtocol,
  getRequestUrls,
  getRequests,
  postRunInstanceResponse,
  disableCaptureProtocolWithMessage,
  CAPTURE_PROTOCOL_UPLOAD_URL,
  routeHandlers,
} = require('../lib/serverStub')
const { randomBytes } = require('crypto')
const { PROTOCOL_STUB_CONSTRUCTOR_ERROR, PROTOCOL_STUB_NONFATAL_ERROR, PROTOCOL_STUB_BEFORESPEC_ERROR, PROTOCOL_STUB_BEFORETEST_ERROR } = require('../lib/protocol-stubs/protocolStubResponse')
const debug = require('debug')('cypress:system-tests:record_spec')

const { instanceId } = postRunInstanceResponse

describe('capture-protocol', () => {
  setupStubbedServer(createRoutes())
  beforeEach(() => {
    // uploads happen too fast to be captured by these tests without tuning these values
    process.env.CYPRESS_UPLOAD_ACTIVITY_INTERVAL = 100
  })

  describe('disabled messaging', () => {
    disableCaptureProtocolWithMessage('Test Replay is only supported in Chromium browsers')

    it('displays disabled message but continues', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      })
    })
  })

  describe('enabled', () => {
    let archiveFile = ''

    beforeEach(async () => {
      const dbPath = path.join(os.tmpdir(), 'cypress', 'protocol')

      archiveFile = path.join(dbPath, `${instanceId}.tar`)

      await fsPromise.mkdir(dbPath, { recursive: true })

      debug('writing archive to', archiveFile)

      return fsPromise.writeFile(archiveFile, randomBytes(128))
    })

    describe('passing', () => {
      enableCaptureProtocol()
      it('retrieves the capture protocol, uploads the db, and updates the artifact upload report', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          spec: 'record_pass*',
          record: true,
          snapshot: true,
        }).then((ret) => {
          const urls = getRequestUrls()
          const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

          expect(urls).to.include.members([`PUT ${CAPTURE_PROTOCOL_UPLOAD_URL}`])

          expect(artifactReport?.protocol).to.an('object')
          expect(artifactReport?.protocol?.url).to.be.a('string')
          expect(artifactReport?.protocol?.uploadDuration).to.be.a('number')
        })
      })
    })

    describe('when the tab crashes in chrome', () => {
      enableCaptureProtocol()
      it('posts accurate test results', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          configFile: 'cypress-with-project-id.config.js',
          browser: 'chrome',
          spec: 'chrome_tab_crash*,record_pass*',
          record: true,
          snapshot: true,
          expectedExitCode: 1,
        }).then(() => {
          const requests = getRequests()
          const postResultsRequest = requests.find((r) => r.url === `POST /instances/${instanceId}/results`)

          expect(postResultsRequest.body.exception).to.include('Chrome Renderer process just crashed')
          expect(postResultsRequest.body.tests).to.have.length(2)
          expect(postResultsRequest.body.stats.suites).to.equal(1)
          expect(postResultsRequest.body.stats.tests).to.equal(2)
          expect(postResultsRequest.body.stats.passes).to.equal(1)
          expect(postResultsRequest.body.stats.failures).to.equal(1)
          expect(postResultsRequest.body.stats.skipped).to.equal(0)
        })
      })
    })

    describe('when there is an async error thrown from config file', () => {
      enableCaptureProtocol()
      it('posts accurate test results', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          browser: 'chrome',
          project: 'config-with-crashing-plugin',
          spec: 'simple_multiple.cy.js',
          configFile: 'cypress-with-project-id.config.js',
          record: true,
          snapshot: false,
          expectedExitCode: 1,
        }).then(() => {
          const requests = getRequests()
          const postResultsRequest = requests.find((r) => r.url === `POST /instances/${instanceId}/results`)

          expect(postResultsRequest?.body.exception).to.include('Your configFile threw an error')
        })
      })
    })

    describe('protocol runtime errors', () => {
      enableCaptureProtocol()
      describe('db size too large', () => {
        beforeEach(() => {
          return fsPromise.writeFile(archiveFile, randomBytes(1024))
        })

        afterEach(async () => {
          if (fs.existsSync(archiveFile)) {
            return fsPromise.rm(archiveFile)
          }
        })

        it('displays error and does not upload if db size is too large', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          }).then(() => {
            const urls = getRequestUrls()

            expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])
            expect(urls).not.to.include.members([`PUT ${CAPTURE_PROTOCOL_UPLOAD_URL}`])

            const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

            expect(artifactReport?.protocol).to.exist()
            expect(artifactReport?.protocol?.error).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.errorStack).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.url).to.exist().and.not.be.empty()
          })
        })
      })

      describe('error initializing protocol', () => {
        enableCaptureProtocol(PROTOCOL_STUB_CONSTRUCTOR_ERROR)

        it('displays the error and reports the fatal error to cloud via artifacts', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          }).then(() => {
            const urls = getRequestUrls()

            expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])
            expect(urls).not.to.include.members([`PUT ${CAPTURE_PROTOCOL_UPLOAD_URL}`])

            const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

            expect(artifactReport?.protocol).to.exist()
            expect(artifactReport?.protocol?.error).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.errorStack).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.url).to.exist().and.not.be.empty()
          })
        })
      })

      describe('error in protocol beforeSpec', () => {
        enableCaptureProtocol(PROTOCOL_STUB_BEFORESPEC_ERROR)

        it('displays the error and reports the fatal error to the cloud via artifacts', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          }).then(() => {
            const urls = getRequestUrls()

            expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])
            expect(urls).not.to.include.members([`PUT ${CAPTURE_PROTOCOL_UPLOAD_URL}`])

            const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

            expect(artifactReport?.protocol).to.exist()
            expect(artifactReport?.protocol?.error).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.errorStack).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.url).to.exist().and.not.be.empty()
          })
        })
      })

      describe('error in protocol beforeTest', () => {
        enableCaptureProtocol(PROTOCOL_STUB_BEFORETEST_ERROR)

        it('displays the error and reports the fatal error to the cloud via artifacts', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          }).then(() => {
            const urls = getRequestUrls()

            expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])
            expect(urls).not.to.include.members([`PUT ${CAPTURE_PROTOCOL_UPLOAD_URL}`])

            const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

            expect(artifactReport?.protocol).to.exist()
            expect(artifactReport?.protocol?.error).to.exist().and.not.to.be.empty()
            expect(artifactReport?.protocol?.url).to.exist().and.not.be.empty()
          })
        })
      })

      describe('non-fatal error encountered during protocol capture', () => {
        enableCaptureProtocol(PROTOCOL_STUB_NONFATAL_ERROR)

        it('reports the error to the protocol error endpoint', function () {
          return systemTests.exec(this, {
            key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
            configFile: 'cypress-with-project-id.config.js',
            spec: 'record_pass*',
            record: true,
            snapshot: true,
          }).then(() => {
            const reportErrorUrl = 'POST /capture-protocol/errors'
            const urls = getRequestUrls()

            debug(urls)
            expect(urls).to.include.members([reportErrorUrl])

            const errorReport = getRequests().find(({ url }) => url === reportErrorUrl).body

            debug(errorReport)
            expect(errorReport.errors).to.be.length(4)

            errorReport.errors.forEach((e) => {
              expect(e.captureMethod).to.eq('commandLogAdded')
              expect(e.runnableId).to.eq('r3')
            })

            expect(errorReport.context.specName).to.eq('cypress/e2e/record_pass.cy.js')
            expect(errorReport.context.projectSlug).to.eq('pid123')
            expect(errorReport.context.osName).to.eq(os.platform())
          })
        })
      })
    })
  })
})

describe('capture-protocol api errors', () => {
  beforeEach(() => {
    // uploads happen too fast to be captured by these tests without tuning these values
    process.env.CYPRESS_UPLOAD_ACTIVITY_INTERVAL = 100
  })

  enableCaptureProtocol()

  const stubbedServerWithErrorOn = (endpoint, numberOfFailuresBeforeSuccess = Number.MAX_SAFE_INTEGER) => {
    let failures = 0

    return setupStubbedServer(createRoutes({
      [endpoint]: {
        res: (req, res) => {
          if (failures < numberOfFailuresBeforeSuccess) {
            failures += 1
            res.status(500).send('500 - Internal Server Error')
          } else {
            routeHandlers[endpoint].res(req, res)
          }
        },
      },
    }))
  }

  describe('upload 500 - retries 8 times and fails', () => {
    stubbedServerWithErrorOn('putCaptureProtocolUpload')
    it('continues', function () {
      process.env.API_RETRY_INTERVALS = '1000'

      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      }).then(() => {
        const urls = getRequestUrls()

        expect(urls).to.include.members([`PUT /instances/${instanceId}/artifacts`])

        const artifactReport = getRequests().find(({ url }) => url === `PUT /instances/${instanceId}/artifacts`)?.body

        expect(artifactReport?.protocol).to.exist()
        expect(artifactReport?.protocol?.error).to.equal('Failed to upload after 8 attempts. Errors: Internal Server Error, Internal Server Error, Internal Server Error, Internal Server Error, Internal Server Error, Internal Server Error, Internal Server Error, Internal Server Error')
        expect(artifactReport?.protocol?.errorStack).to.exist().and.not.to.be.empty()
      })
    })
  })

  describe('upload 500 - retries 7 times and succeeds on the last call', () => {
    stubbedServerWithErrorOn('putCaptureProtocolUpload', 7)

    let archiveFile = ''

    beforeEach(async () => {
      const dbPath = path.join(os.tmpdir(), 'cypress', 'protocol')

      archiveFile = path.join(dbPath, `${instanceId}.tar`)

      await fsPromise.mkdir(dbPath, { recursive: true })

      return fsPromise.writeFile(archiveFile, randomBytes(128))
    })

    it('continues', function () {
      process.env.API_RETRY_INTERVALS = '1000'

      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      })
    })
  })

  describe('fetch script 500', () => {
    stubbedServerWithErrorOn('getCaptureScript')
    it('continues', function () {
      process.env.API_RETRY_INTERVALS = '1000'

      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      })
    })
  })

  describe('error report 500', () => {
    stubbedServerWithErrorOn('postCaptureProtocolErrors')

    let archiveFile = ''

    beforeEach(async () => {
      const dbPath = path.join(os.tmpdir(), 'cypress', 'protocol')

      archiveFile = path.join(dbPath, `${instanceId}.tar`)

      await fsPromise.mkdir(dbPath, { recursive: true })

      return fsPromise.writeFile(archiveFile, randomBytes(128))
    })

    it('continues', function () {
      process.env.API_RETRY_INTERVALS = '1000'

      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        configFile: 'cypress-with-project-id.config.js',
        spec: 'record_pass*',
        record: true,
        snapshot: true,
      })
    })
  })
})
