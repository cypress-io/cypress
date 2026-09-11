require('../../spec_helper')

const { isBrowserNetworkMode, ensureProxyServer } = require('../../../lib/util/network-mode')

const chrome = { name: 'chrome', family: 'chromium' }
const electron = { name: 'electron', family: 'chromium' }
const firefox = { name: 'firefox', family: 'firefox' }
const webkit = { name: 'webkit', family: 'webkit' }

describe('lib/util/network-mode', () => {
  context('.isBrowserNetworkMode', () => {
    it('is true for chromium-family browsers by default', () => {
      expect(isBrowserNetworkMode({}, chrome)).to.be.true
      expect(isBrowserNetworkMode({ forceHttp1: false }, chrome)).to.be.true
    })

    it('is false for chromium-family browsers when forceHttp1 is true', () => {
      expect(isBrowserNetworkMode({ forceHttp1: true }, chrome)).to.be.false
    })

    // Electron is deprecated as a test browser, so it is not carried onto the
    // browser network path even though it is chromium-family.
    it('is false for electron regardless of forceHttp1', () => {
      expect(isBrowserNetworkMode({}, electron)).to.be.false
      expect(isBrowserNetworkMode({ forceHttp1: false }, electron)).to.be.false
      expect(isBrowserNetworkMode({ forceHttp1: true }, electron)).to.be.false
    })

    it('is false for non-chromium browsers regardless of forceHttp1', () => {
      expect(isBrowserNetworkMode({}, firefox)).to.be.false
      expect(isBrowserNetworkMode({ forceHttp1: true }, firefox)).to.be.false
      expect(isBrowserNetworkMode({}, webkit)).to.be.false
      expect(isBrowserNetworkMode({ forceHttp1: true }, webkit)).to.be.false
    })
  })

  context('.ensureProxyServer', () => {
    it('returns the configured proxyServer', () => {
      expect(ensureProxyServer({ proxyServer: 'http://localhost:1234' })).to.eq('http://localhost:1234')
    })

    it('throws when proxyServer is missing', () => {
      expect(() => ensureProxyServer({})).to.throw('Missing proxyServer in launch')
    })
  })
})
