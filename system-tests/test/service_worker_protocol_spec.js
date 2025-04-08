const fs = require('fs-extra')
const path = require('path')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')
const {
  createRoutes,
  setupStubbedServer,
  enableCaptureProtocol,
} = require('../lib/serverStub')
const { PROTOCOL_STUB_SERVICE_WORKER } = require('../lib/protocol-stubs/protocolStubResponse')

const getFilePath = (filename) => {
  return path.join(
    Fixtures.projectPath('protocol'),
    'cypress',
    'system-tests-protocol-dbs',
    `${filename}.json`,
  )
}

const BROWSERS = ['chrome', 'electron']

describe('capture-protocol', () => {
  setupStubbedServer(createRoutes())
  enableCaptureProtocol(PROTOCOL_STUB_SERVICE_WORKER)

  describe('service worker', () => {
    BROWSERS.forEach((browser) => {
      it(`verifies the types of requests match - ${browser}`, function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          project: 'protocol',
          // Here we are testing that service worker and non-service worker specs can intermingle properly
          // Also, protocol.cy.js is not secure which will cause window.ServiceWorkerContainer to not be available
          // in the browser. We test that no exceptions are thrown when this happens.
          spec: 'protocol.cy.js,service-worker.cy.js',
          record: true,
          expectedExitCode: 0,
          port: 2121,
          browser,
        }).then(() => {
          const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

          const parsedProtocolEvents = JSON.parse(protocolEvents)

          expect(parsedProtocolEvents.multipleNetworkRequestEventsForSameRequestId).to.be.false
          expect(parsedProtocolEvents.correlatedUrls).to.eql({
            'http://localhost:3131/index.html': ['frame id'],
            // Only correlations occur in the service worker for this asset
            'http://localhost:2121/cypress/fixtures/service-worker-assets/example.json': ['no frame id'],
            // Only correlations occur in the service worker for this asset
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/cached-service-worker.json': ['no frame id'],
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/load.js': ['frame id'],
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/service_worker.html': ['frame id', 'no frame id', 'no frame id'],
          })

          expect(parsedProtocolEvents.exceptionThrown).to.be.false
        })
      })

      it(`verifies the types of requests match for a preloaded service worker - ${browser}`, function () {
        // retry the system test up to 10 times
        // remove the retry logic once the test is stable
        // see https://github.com/cypress-io/cypress/issues/29950
        this.retries(10)

        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          project: 'protocol',
          configFile: 'cypress-with-service-worker-preloaded.config.ts',
          // Here we are testing that when a service worker is preloaded it can properly be captured
          spec: 'service-worker-preloaded.cy.js',
          record: true,
          expectedExitCode: 0,
          port: 2121,
          browser,
        }).then(() => {
          const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

          const parsedProtocolEvents = JSON.parse(protocolEvents)

          expect(parsedProtocolEvents.multipleNetworkRequestEventsForSameRequestId).to.be.false
          expect(parsedProtocolEvents.correlatedUrls).to.eql({
            'http://localhost:2121/cypress/fixtures/service-worker-assets/example.json': ['no frame id'],
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/cached-service-worker.json': ['no frame id'],
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/load-with-service-worker-preloaded.js': ['no frame id'],
            'http://localhost:2121/cypress/fixtures/service-worker-assets/scope/service_worker_preloaded.html': ['no frame id', 'no frame id', 'no frame id', 'no frame id'],
          })

          expect(parsedProtocolEvents.exceptionThrown).to.be.false
        })
      })
    })
  })
})
