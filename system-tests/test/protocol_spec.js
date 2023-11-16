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
const numberRegex = /"(wallClockDuration|fnDuration|afterFnDuration|lifecycle|duration|timestamp|createdAtTimestamp|updatedAtTimestamp|x|y|top|left|topCenter|leftCenter|requestId|cdpRequestWillBeSentTimestamp|cdpRequestWillBeSentReceivedTimestamp|proxyRequestReceivedTimestamp|cdpLagDuration|proxyRequestCorrelationDuration)": \"?(0|[1-9]\d*)(\.\d+)?\"?/g
const pathRegex = /"(name|absoluteFile)": "\/[^"]+"/g
const componentSpecPathRegex = /"(url|message)": "(http:\/\/localhost:2121\/__cypress\/iframes\/index.html\?specPath=)(.*)(\/protocol\/src\/components\/)(.*)"/g

const normalizeEvents = (resultsJson) => {
  return resultsJson
  .replace(isoDateRegex, '"Any.ISODate"')
  .replace(numberRegex, '"$1": "Any.Number"')
  .replace(pathRegex, '"$1": "/path/to/$1"')
  .replace(componentSpecPathRegex, '"$1": "$2$4$5"')
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
        spec: 'protocol.cy.js,test-isolation.cy.js',
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
