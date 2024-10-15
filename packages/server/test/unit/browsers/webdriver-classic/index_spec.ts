import nock from 'nock'
import { expect } from '../../../spec_helper'
import { WebDriverClassic } from '../../../../lib/browsers/webdriver-classic'

describe('lib/browsers/webdriver-classic', () => {
  let mockSessionId: string
  let mockOpts: {
    host: string
    port: number
  }
  let nockContext: nock.Scope

  beforeEach(() => {
    mockSessionId = `123456-abcdef`
    mockOpts = {
      host: '127.0.0.1',
      port: 3000,
    }

    nockContext = nock(`http://${mockOpts.host}:${mockOpts.port}`)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('WebDriverClassic.createSession', () => {
    it('can create a session', async () => {
      const newSessionScope = nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
            binary: '/path/to/binary',
            'moz:firefoxOptions': {
              args: ['-headless', '-new-instance'],
              env: {
                foo: 'bar',
              },
              prefs: {
                'remote.active-protocols': 1,
              },
            },
            'moz:debuggerAddress': true,
          },
        },
      }).reply(200, {
        value: {
          capabilities: {
            acceptInsecureCerts: true,
            browserName: 'firefox',
            browserVersion: '130.0',
            'moz:accessibilityChecks': false,
            'moz:buildID': '20240829075237',
            'moz:geckodriverVersion': '0.35.0',
            'moz:headless': false,
            'moz:platformVersion': '23.3.0',
            'moz:profile': '/path/to/profile',
            'moz:processID': 12345,
            'moz:shutdownTimeout': 60000,
            'moz:windowless': false,
            'moz:webdriverClick': true,
            'pageLoadStrategy': 'normal',
            platformName: 'mac',
            proxy: {},
            setWindowRect: true,
            strictFileInteractability: false,
            timeouts: {
              implicit: 0,
              pageLoad: 300000,
              script: 30000,
            },
            unhandledPromptBehavior: 'dismiss and notify',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0',
            'moz:debuggerAddress': '127.0.0.1:3001',
          },
          sessionId: mockSessionId,
        },
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      const { capabilities } = await wdc.createSession({
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
            binary: '/path/to/binary',
            'moz:firefoxOptions': {
              args: ['-headless', '-new-instance'],
              env: {
                foo: 'bar',
              },
              prefs: {
                'remote.active-protocols': 1,
              },
            },
            'moz:debuggerAddress': true,
          },
        },
      })

      // test a few expected capabilities from the response
      expect(capabilities.acceptInsecureCerts).to.be.true
      expect(capabilities['moz:debuggerAddress']).to.equal('127.0.0.1:3001')
      expect(capabilities.platformName).to.equal('mac')

      newSessionScope.done()
    })

    it('throws if session cannot be created (detailed)', () => {
      nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
          },
        },
      }).reply(500, {
        value: {
          error: 'session not created',
          message: 'failed to set preferences: unknown error',
        },
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      expect(wdc.createSession({
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
          },
        },
      })).to.be.rejectedWith('500: Internal Server Error. session not created. failed to set preferences: unknown error.')
    })

    it('throws if session cannot be created (generic)', () => {
      nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
          },
        },
      }).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      expect(wdc.createSession({
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
          },
        },
      })).to.be.rejectedWith('500: Internal Server Error.')
    })
  })

  describe('WebDriverClassic.installAddOn', () => {
    it('can install extensions', async () => {
      const installExtensionScope = nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
        path: '/path/to/ext',
        temporary: true,
      }).reply(200)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      await wdc.installAddOn({
        path: '/path/to/ext',
        temporary: true,
      })

      installExtensionScope.done()
    })

    it('throws if extension cannot be installed', () => {
      nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
        path: '/path/to/ext',
        temporary: true,
      }).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      expect(wdc.installAddOn({
        path: '/path/to/ext',
        temporary: true,
      })).to.be.rejectedWith('500: Internal Server Error')
    })
  })

  describe('WebDriverClassic.getWindowHandles', () => {
    it('returns the page contexts when the requests succeeds', async () => {
      const expectedContexts = ['mock-context-id-1']

      nockContext.get(`/session/${mockSessionId}/window/handles`).reply(200, {
        value: expectedContexts,
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      const contexts = await wdc.getWindowHandles()

      expect(contexts).to.deep.equal(expectedContexts)
    })

    it('throws an error if the request fails', async () => {
      nockContext.get(`/session/${mockSessionId}/window/handles`).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      expect(wdc.getWindowHandles()).to.be.rejectedWith('500: Internal Server Error')
    })
  })

  describe('WebDriverClassic.switchToWindow', () => {
    it('returns null when the requests succeeds', async () => {
      nockContext.post(`/session/${mockSessionId}/window`, {
        handle: 'mock-context-id',
      }).reply(200, {
        value: null,
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      const payload = await wdc.switchToWindow('mock-context-id')

      expect(payload).to.equal(null)
    })

    it('throws an error if the request fails', async () => {
      nockContext.post(`/session/${mockSessionId}/window`, {
        handle: 'mock-context-id',
      }).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      expect(wdc.switchToWindow('mock-context-id')).to.be.rejectedWith('500: Internal Server Error')
    })
  })

  describe('WebDriverClassic.navigate', () => {
    let mockNavigationUrl = 'http://localhost:8080'

    it('returns null when the requests succeeds', async () => {
      nockContext.post(`/session/${mockSessionId}/url`, {
        url: mockNavigationUrl,
      }).reply(200, {
        value: null,
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      const payload = await wdc.navigate(mockNavigationUrl)

      expect(payload).to.equal(null)
    })

    it('throws an error if the request fails', async () => {
      nockContext.post(`/session/${mockSessionId}/url`, {
        url: mockNavigationUrl,
      }).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      expect(wdc.navigate(mockNavigationUrl)).to.be.rejectedWith('500: Internal Server Error')
    })
  })

  describe('WebDriverClassic.maximizeWindow', () => {
    it('returns null when the requests succeeds', async () => {
      nockContext.post(`/session/${mockSessionId}/window/maximize`).reply(200, {
        value: null,
      })

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      const payload = await wdc.maximizeWindow()

      expect(payload).to.equal(null)
    })

    it('throws an error if the request fails', async () => {
      nockContext.post(`/session/${mockSessionId}/window/maximize`).reply(500)

      const wdc = new WebDriverClassic(mockOpts.host, mockOpts.port)

      // @ts-expect-error
      wdc.sessionId = mockSessionId

      expect(wdc.maximizeWindow()).to.be.rejectedWith('500: Internal Server Error')
    })
  })
})
