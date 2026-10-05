import { describe, expect, it } from 'vitest'
import { isBrowserNetworkMode, ensureProxyServer } from '../../../lib/util/network-mode'

const chrome = { name: 'chrome', family: 'chromium' }
const electron = { name: 'electron', family: 'chromium' }
const firefox = { name: 'firefox', family: 'firefox' }
const webkit = { name: 'webkit', family: 'webkit' }

describe('lib/util/network-mode', () => {
  describe('.isBrowserNetworkMode', () => {
    it('is true for chromium-family browsers by default', () => {
      expect(isBrowserNetworkMode({}, chrome)).toBe(true)
      expect(isBrowserNetworkMode({ forceHttp1: false }, chrome)).toBe(true)
    })

    it('is false for chromium-family browsers when forceHttp1 is true', () => {
      expect(isBrowserNetworkMode({ forceHttp1: true }, chrome)).toBe(false)
    })

    // Electron is deprecated as a test browser, so it is not carried onto the
    // browser network path even though it is chromium-family.
    it('is false for electron regardless of forceHttp1', () => {
      expect(isBrowserNetworkMode({}, electron)).toBe(false)
      expect(isBrowserNetworkMode({ forceHttp1: false }, electron)).toBe(false)
      expect(isBrowserNetworkMode({ forceHttp1: true }, electron)).toBe(false)
    })

    it('is false for non-chromium browsers regardless of forceHttp1', () => {
      expect(isBrowserNetworkMode({}, firefox)).toBe(false)
      expect(isBrowserNetworkMode({ forceHttp1: true }, firefox)).toBe(false)
      expect(isBrowserNetworkMode({}, webkit)).toBe(false)
      expect(isBrowserNetworkMode({ forceHttp1: true }, webkit)).toBe(false)
    })
  })

  describe('.ensureProxyServer', () => {
    it('returns the configured proxyServer', () => {
      expect(ensureProxyServer({ proxyServer: 'http://localhost:1234' })).toBe('http://localhost:1234')
    })

    it('throws when proxyServer is missing', () => {
      expect(() => ensureProxyServer({})).toThrow('Missing proxyServer in launch')
    })
  })
})
