import {detectBrowserLinux} from '../../../lib/linux'
const execa = require('execa')
const sinon = require("sinon")

describe('linux browser detection', () => {
  beforeEach(function stubShell () {
    sinon.stub(execa, 'shell').withArgs('test-browser --version')
      .returns(Promise.resolve({
        stdout: 'test-browser v100.1.2.3'
      }))
  })

  afterEach(() => {
    execa.shell.restore()
  })

  it('detects browser by running --version', () => {
    const goal = {
      name: 'test-browser-name',
      versionRegex: /v(\S+)$/,
      profile: true,
      binary: 'test-browser'
    }
    const checkBrowser = (browser) => {
      expect(browser).to.deep.equal({
        name: 'test-browser-name',
        path: 'test-browser',
        version: '100.1.2.3'
      })
    }
    return detectBrowserLinux(goal).then(checkBrowser)
  })
})
