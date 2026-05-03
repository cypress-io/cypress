const fs = require('fs-extra')
const path = require('path')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')
const {
  createRoutes,
  setupStubbedServer,
  enableCaptureProtocol,
} = require('../lib/serverStub')

// source: https://www.myintervals.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
const isoDateRegex = /"([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?"/g
const numberRegex = /"(wallClockDuration|fnDuration|afterFnDuration|lifecycle|duration|durationMs|timestamp|wallTime|createdAtTimestamp|updatedAtTimestamp|x|y|top|left|topCenter|leftCenter|requestId|cdpRequestWillBeSentTimestamp|cdpRequestWillBeSentReceivedTimestamp|proxyRequestReceivedTimestamp|cdpLagDuration|proxyRequestCorrelationDuration)": \"?(0|[1-9]\d*)(\.\d+)?\"?/g
const pathRegex = /"(name|absoluteFile)": "\/[^"]+"/g
const componentSpecPathRegex = /"(url|message)": "(http:\/\/localhost:2121\/__cypress\/iframes\/index.html\?specPath=)(.*)(\/protocol\/src\/components\/)(.*)"/g
// SHA-1 hex (40 chars) — used by cy.request body hashes; varies per body bytes
// even for deterministic content if the system adds a trailing newline, etc.
const shaHashRegex = /"(requestBodyHash|responseBodyHash)": "[a-f0-9]{40}"/g
// Server-emitted response headers that vary per run. Uses a JSON-string body
// match so that values containing escaped quotes (e.g. weak ETags `W/"..."`)
// are scrubbed in full rather than truncated at the first inner quote.
const volatileResponseHeaderRegex = /"(date|etag|last-modified)": "(?:[^"\\]|\\.)*"/g
// cy.request requestId counter resets each spec run but doesn't always start
// from the same number when other code paths share `_.uniqueId('cyrequest_')`.
const cyRequestIdRegex = /"requestId": "cyrequest_\d+"/g
// log:added/log:changed log id format — varies per run.
const cyRequestLogIdRegex = /"logId": "log-[^"]+"/g
// User-Agent in cy.request requestHeaders varies by the OS the run executes on
// (e.g. macOS locally vs. Linux in CI). The browser/Cypress version is asserted
// elsewhere; here we only care that the header is captured.
const userAgentHeaderRegex = /"user-agent": "(?:[^"\\]|\\.)*"/g
// `From Node.js Internals:` section of the cy.request error stack contains
// frame line/column numbers + function-name shapes that change across Node /
// libuv builds and across operating systems. Strip the whole tail.
const nodeInternalsStackRegex = /From Node\.js Internals:\\n[^"]*/g
// Volatile parsedStack frames — those originating in `<embedded>` (the bundled
// Cypress server code) or any `node:...` builtin module — drift across runs.
// Match from the first such frame through the closing `]` of the array, which
// also collapses any trailing empty `{ "message": "", "whitespace": "..." }`
// entries that some Node versions append.
const parsedStackVolatileTailRegex = /\{[^{}]*"originalFile": "(?:<embedded>|node:[^"]*)"[\s\S]*?\n(\s*)\]/g

const normalizeEvents = (resultsJson) => {
  return resultsJson
  .replace(isoDateRegex, '"Any.ISODate"')
  .replace(numberRegex, '"$1": "Any.Number"')
  .replace(pathRegex, '"$1": "/path/to/$1"')
  .replace(componentSpecPathRegex, '"$1": "$2$4$5"')
  .replace(shaHashRegex, '"$1": "Any.Sha1Hash"')
  .replace(volatileResponseHeaderRegex, '"$1": "Any.HeaderValue"')
  .replace(userAgentHeaderRegex, '"user-agent": "Any.UserAgent"')
  .replace(nodeInternalsStackRegex, 'From Node.js Internals: Any.NodeStack')
  .replace(parsedStackVolatileTailRegex, '{ "frame": "Any.NodeStack" }\n$1]')
  .replace(cyRequestIdRegex, '"requestId": "cyrequest_Any.Number"')
  .replace(cyRequestLogIdRegex, '"logId": "Any.LogId"')
}

const getFilePath = (filename) => {
  return path.join(
    Fixtures.projectPath('protocol'),
    'cypress',
    'system-tests-protocol-dbs',
    `${filename}.json`,
  )
}

describe('capture-protocol', () => {
  setupStubbedServer(createRoutes())
  enableCaptureProtocol()

  describe('e2e', () => {
    it('verifies the protocol events are correct', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'protocol',
        spec: 'protocol.cy.js,test-isolation.cy.js,shadow-dom.cy.js',
        record: true,
        expectedExitCode: 0,
        port: 2121,
        config: {
          hosts: {
            '*foobar.com': '127.0.0.1',
          },
        },
      }).then(() => {
        const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

        systemTests.snapshot('e2e events', normalizeEvents(protocolEvents))

        fs.removeSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'))
      })
    })

    it('verifies that the debug data is correct', async function () {
      await systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'protocol',
        spec: 'protocol.cy.js',
        record: true,
        expectedExitCode: 0,
        port: 2121,
        configFile: 'cypress-with-file-preprocessor.config.ts',
      })

      const protocolEvents = await fs.promises.readFile(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

      expect(JSON.parse(protocolEvents).debugData.filePreprocessorHandlerText).to.equal('file=>{return file.filePath}')
    })

    it('verifies the cy.request protocol events are correct', function () {
      return systemTests.exec(this, {
        key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
        project: 'protocol',
        spec: 'cy-request.cy.js',
        record: true,
        expectedExitCode: 0,
        port: 2121,
      }).then(() => {
        const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

        systemTests.snapshot('cy.request events', normalizeEvents(protocolEvents))

        fs.removeSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'))
      })
    })
  })

  describe('component', () => {
    [true, false].forEach((experimentalSingleTabRunMode) => {
      it('verifies the protocol events are correct', function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          project: 'protocol',
          record: true,
          expectedExitCode: 0,
          testingType: 'component',
          port: 2121,
          config: {
            component: {
              experimentalSingleTabRunMode,
            },
          },
        }).then(() => {
          const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

          systemTests.snapshot(`component events - experimentalSingleTabRunMode: ${experimentalSingleTabRunMode}`, normalizeEvents(protocolEvents))

          fs.removeSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'))
        })
      })
    })
  })
})
