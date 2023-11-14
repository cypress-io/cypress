const fs = require('fs-extra')
const path = require('path')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')
const {
  createRoutes,
  setupStubbedServer,
  enableCaptureProtocol,
} = require('../lib/serverStub')
const { PROTOCOL_STUB_FONT_FLOODING } = require('../lib/protocol-stubs/protocolStubResponse')

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
  enableCaptureProtocol(PROTOCOL_STUB_FONT_FLOODING)

  describe('font flooding', () => {
    BROWSERS.forEach((browser) => {
      it(`verifies the number of font requests is correct - ${browser}`, function () {
        return systemTests.exec(this, {
          key: 'f858a2bc-b469-4e48-be67-0876339ee7e1',
          project: 'protocol',
          spec: 'font-flooding.cy.js',
          record: true,
          expectedExitCode: 0,
          port: 2121,
          browser,
          config: {
            hosts: {
              '*foobar.com': '127.0.0.1',
            },
          },
        }).then(() => {
          const protocolEvents = fs.readFileSync(getFilePath('e9e81b5e-cc58-4026-b2ff-8ae3161435a6.db'), 'utf8')

          expect(JSON.parse(protocolEvents).numberOfFontRequests).to.equal(2)
        })
      })
    })
  })
})
