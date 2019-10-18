import * as linuxHelper from '../../../lib/linux'
import { log } from '../../log'
import { detect, detectByPath } from '../../../lib/detect'
import execa from 'execa'
import sinon from 'sinon'

const goalBrowsers = [
  {
    displayName: 'Test Browser',
    name: 'test-browser-name',
    versionRegex: /test-browser v(\S+)$/,
    profile: true,
    binary: 'test-browser',
  },
  {
    displayName: 'Foo Browser',
    name: 'foo-browser',
    versionRegex: /foo-browser v(\S+)$/,
    profile: true,
    binary: ['foo-browser', 'foo-bar-browser'],
  },
]

describe('linux browser detection', () => {
  beforeEach(function stubShell () {
    const stdout = sinon.stub(execa, 'stdout')

    stdout.withArgs('test-browser', ['--version'])
    .resolves('test-browser v100.1.2.3')

    stdout.withArgs('foo-browser', ['--version'])
    .resolves('foo-browser v100.1.2.3')

    stdout.withArgs('foo-bar-browser', ['--version'])
    .resolves('foo-browser v100.1.2.3')

    stdout.withArgs('/Applications/My Shiny New Browser.app', ['--version'])
    .resolves('foo-browser v100.1.2.3')

    stdout.withArgs('/foo/bar/browser', ['--version'])
    .resolves('foo-browser v9001.1.2.3')

    stdout.withArgs('/not/a/browser', ['--version'])
    .resolves('not a browser version string')

    stdout.withArgs('/not/a/real/path', ['--version'])
    .rejects()
  })

  afterEach(() => {
    execa.stdout.restore()
  })

  it('detects browser by running --version', () => {
    const goal = goalBrowsers[0]
    const checkBrowser = (browser) => {
      expect(browser).to.deep.equal({
        name: 'test-browser-name',
        path: 'test-browser',
        version: '100.1.2.3',
      })
    }

    return linuxHelper.detect(goal).then(checkBrowser)
  })

  // despite using detect(), this test is in linux/spec instead of detect_spec because it is
  // testing side effects that occur within the Linux-specific detect function
  // https://github.com/cypress-io/cypress/issues/1400
  it('properly eliminates duplicates', () => {
    const expected = [
      {
        displayName: 'Test Browser',
        name: 'test-browser-name',
        version: '100.1.2.3',
        path: 'test-browser',
        majorVersion: '100',
      },
      {
        displayName: 'Foo Browser',
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
      },
    ]

    return detect(goalBrowsers).then((browsers) => {
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
        binary: ['foo-browser', 'foo-bar-browser'],
      },
    ]

    const expected = [
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
      },
    ]

    return detect(goalBrowsers).then((browsers) => {
      log('Browsers: %o', browsers)
      log('Expected browsers: %o', expected)
      expect(browsers).to.deep.equal(expected)
    })
  })

  describe('detectByPath', () => {
    it('detects by path', () => {
      return detectByPath('/foo/bar/browser', goalBrowsers)
      .then((browser) => {
        return expect(browser).to.deep.equal(
          Object.assign({}, goalBrowsers.find((gb) => {
            return gb.name === 'foo-browser'
          }), {
            displayName: 'Custom Foo Browser',
            info: 'Loaded from /foo/bar/browser',
            custom: true,
            version: '9001.1.2.3',
            majorVersion: '9001',
            path: '/foo/bar/browser',
          })
        )
      })
    })

    it('rejects when there was no matching versionRegex', () => {
      return detectByPath('/not/a/browser', goalBrowsers)
      .then(() => {
        throw Error('Should not find a browser')
      })
      .catch((err) => {
        expect(err.notDetectedAtPath).to.be.true
      })
    })

    it('rejects when there was an error executing the command', () => {
      return detectByPath('/not/a/real/path', goalBrowsers)
      .then(() => {
        throw Error('Should not find a browser')
      })
      .catch((err) => {
        expect(err.notDetectedAtPath).to.be.true
      })
    })

    it('works with spaces in the path', () => {
      return detectByPath('/Applications/My Shiny New Browser.app', goalBrowsers)
      .then((browser) => {
        return expect(browser).to.deep.equal(
          Object.assign({}, goalBrowsers.find((gb) => {
            return gb.name === 'foo-browser'
          }), {
            displayName: 'Custom Foo Browser',
            info: 'Loaded from /Applications/My Shiny New Browser.app',
            custom: true,
            version: '100.1.2.3',
            majorVersion: '100',
            path: '/Applications/My Shiny New Browser.app',
          })
        )
      })
    })
  })
})
