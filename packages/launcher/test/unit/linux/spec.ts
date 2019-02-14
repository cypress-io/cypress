import {detectBrowserLinux} from '../../../lib/linux'
import { log } from '../../log'
import { detect } from '../../../lib/detect'
const execa = require('execa')
const sinon = require("sinon")

const goalBrowsers = [
  {
    name: 'test-browser-name',
    versionRegex: /v(\S+)$/,
    profile: true,
    binary: 'test-browser'
  },
  {
    name: 'foo-browser',
    versionRegex: /v(\S+)$/,
    profile: true,
    binary: 'foo-browser'
  },
  {
    name: 'foo-browser',
    versionRegex: /v(\S+)$/,
    profile: true,
    binary: 'foo-bar-browser'
  }
]

describe('linux browser detection', () => {
  beforeEach(function stubShell () {
    const shell = sinon.stub(execa, 'shell')
    shell.withArgs('test-browser --version')
      .resolves({
        stdout: 'test-browser v100.1.2.3'
      })
    shell.withArgs('foo-browser --version')
      .resolves({
        stdout: 'foo-browser v100.1.2.3'
      })
    shell.withArgs('foo-bar-browser --version')
      .resolves({
        stdout: 'foo-browser v100.1.2.3'
      })
  })

  afterEach(() => {
    execa.shell.restore()
  })

  it('detects browser by running --version', () => {
    const goal = goalBrowsers[0]
    const checkBrowser = (browser) => {
      expect(browser).to.deep.equal({
        name: 'test-browser-name',
        path: 'test-browser',
        version: '100.1.2.3'
      })
    }
    return detectBrowserLinux(goal).then(checkBrowser)
  })

  // despite using detect(), this test is in linux/spec instead of detect_spec because it is 
  // testing side effects that occur within the Linux-specific detectBrowserLinux function
  // https://github.com/cypress-io/cypress/issues/1400
  it('properly eliminates duplicates', () => {
    const expected = [
      {
        name: 'test-browser-name',
        version: '100.1.2.3',
        path: 'test-browser',
        majorVersion: '100'
      },
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100'
      }
    ]
    
    return detect(goalBrowsers).then(browsers => {
      log('Browsers: %o', browsers)
      log('Expected browsers: %o', expected)
      expect(browsers).to.deep.equal(expected)
    })
  })

  it('considers multiple binary names', () => {
    const goalBrowsers = [
      {
        name: 'foo-browser',
        versionRegex: /v(\S+)$/,
        profile: true,
        binary: ['foo-browser', 'foo-bar-browser']
      }
    ]

    const expected = [
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100'
      }
    ]

    return detect(goalBrowsers).then(browsers => {
      log('Browsers: %o', browsers)
      log('Expected browsers: %o', expected)
      expect(browsers).to.deep.equal(expected)
    })
  })
})
