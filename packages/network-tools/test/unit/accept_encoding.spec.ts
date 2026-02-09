import { describe, it, expect } from 'vitest'
import { getSupportedAcceptEncoding } from '../../lib/accept-encoding'

describe('lib/accept-encoding', () => {
  describe('getSupportedAcceptEncoding', () => {
    it('returns br,gzip when client sends gzip, deflate, br', () => {
      expect(getSupportedAcceptEncoding('gzip, deflate, br')).toBe('br,gzip')
    })

    it('returns br only when client sends only br', () => {
      expect(getSupportedAcceptEncoding('br')).toBe('br')
    })

    it('returns gzip only when client sends only gzip', () => {
      expect(getSupportedAcceptEncoding('gzip')).toBe('gzip')
    })

    it('returns identity when client accepts neither gzip nor br', () => {
      expect(getSupportedAcceptEncoding('deflate, identity')).toBe('identity')
    })

    it('returns gzip,identity when no accept-encoding header (undefined)', () => {
      expect(getSupportedAcceptEncoding(undefined)).toBe('gzip,identity')
    })

    it('returns gzip,identity when empty string', () => {
      expect(getSupportedAcceptEncoding('')).toBe('gzip,identity')
    })
  })
})
