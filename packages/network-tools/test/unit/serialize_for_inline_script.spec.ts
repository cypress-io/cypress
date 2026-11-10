import { describe, it, expect } from 'vitest'
import { serializeForInlineScript } from '../../lib/serialize-for-inline-script'

describe('lib/serialize-for-inline-script', () => {
  describe('serializeForInlineScript', () => {
    it('escapes characters that could end the inline script element', () => {
      expect(serializeForInlineScript('</script><!--')).toBe('"\\u003c/script\\u003e\\u003c!--"')
    })

    it('escapes line and paragraph separators', () => {
      expect(serializeForInlineScript('\u2028\u2029')).toBe('"\\u2028\\u2029"')
    })

    it('round-trips to the original value', () => {
      const value = { cookie: '</script><script>alert(1)</script>', quotes: `'"`, separators: '\u2028\u2029' }

      expect(JSON.parse(serializeForInlineScript(value))).toEqual(value)
    })

    it('serializes undefined as null', () => {
      expect(serializeForInlineScript(undefined)).toBe('null')
    })
  })
})
