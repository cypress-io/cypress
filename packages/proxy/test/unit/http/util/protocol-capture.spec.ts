import { describe, expect, it } from 'vitest'
import { getOriginalRequestId } from '../../../../lib/http/util/protocol-capture'

describe('http/util/protocol-capture', () => {
  describe('getOriginalRequestId', () => {
    it('returns a request id without a retry suffix unchanged', () => {
      expect(getOriginalRequestId('1234.56')).toEqual('1234.56')
    })

    it('strips a single-digit retry suffix', () => {
      expect(getOriginalRequestId('1234.56-retry-1')).toEqual('1234.56')
    })

    it('strips a multi-digit retry suffix', () => {
      expect(getOriginalRequestId('1234.56-retry-12')).toEqual('1234.56')
    })

    it('strips only the last retry suffix', () => {
      expect(getOriginalRequestId('1234-retry-1-retry-2')).toEqual('1234-retry-1')
    })

    it('keeps a retry suffix without a number', () => {
      expect(getOriginalRequestId('1234-retry-')).toEqual('1234-retry-')
    })

    it('keeps a retry suffix followed by other characters', () => {
      expect(getOriginalRequestId('1234-retry-1a')).toEqual('1234-retry-1a')
    })

    it('keeps a retry marker that is not a suffix', () => {
      expect(getOriginalRequestId('1234-retry-1.5')).toEqual('1234-retry-1.5')
    })
  })
})
