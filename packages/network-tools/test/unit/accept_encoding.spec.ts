import { describe, it, expect } from 'vitest'
import { getSupportedAcceptEncoding } from '../../lib/accept-encoding'

describe('lib/accept-encoding', () => {
  describe('getSupportedAcceptEncoding', () => {
    it('preserves client order when client sends gzip, deflate, br', () => {
      expect(getSupportedAcceptEncoding('gzip, deflate, br')).toBe('gzip,br')
    })

    it('preserves client order when client sends br, gzip', () => {
      expect(getSupportedAcceptEncoding('br, gzip')).toBe('br,gzip')
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

    it('returns gzip,identity when whitespace-only (trimmed to empty)', () => {
      expect(getSupportedAcceptEncoding('  ')).toBe('gzip,identity')
    })

    it('matches whole tokens only (e.g. x-gzip and br in identity are not matched)', () => {
      expect(getSupportedAcceptEncoding('x-gzip, identity')).toBe('identity')
    })

    it('preserves each part as-is including q-values', () => {
      expect(getSupportedAcceptEncoding('br;q=0.5')).toBe('br;q=0.5')
      expect(getSupportedAcceptEncoding('gzip;q=0.9, br;q=1.0')).toBe('gzip;q=0.9,br;q=1.0')
      expect(getSupportedAcceptEncoding('br;q=0, gzip;q=0.8')).toBe('br;q=0,gzip;q=0.8')
      expect(getSupportedAcceptEncoding('gzip;q=1, br;q=0.9')).toBe('gzip;q=1,br;q=0.9')
    })
  })
})
