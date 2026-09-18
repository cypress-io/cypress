import '../../spec_helper'

import { addNewlineAtEveryNChar } from '../../../lib/util/newlines'

describe('lib/util/newlines', function () {
  context('regular strings', function () {
    it('inserts newline at each n char', function () {
      expect(addNewlineAtEveryNChar('123456789', 3)).to.eq('123\n456\n789')
    })

    it('does not insert newline if str length <= n', function () {
      expect(addNewlineAtEveryNChar('123', 3)).to.eq('123')
    })

    it('returns undefined if str not defined', function () {
      expect(addNewlineAtEveryNChar(undefined, 3)).to.eq(undefined)
    })
  })

  context('strings with ANSI codes', function () {
    it('returns str unchanged if ANSI stripped length <= n', function () {
      const shortAnsiString = '\u001B[31m123\u001B[39m' // "123" in red

      expect(addNewlineAtEveryNChar(shortAnsiString, 3)).to.eq(shortAnsiString)
    })

    it('returns str with ANSI stripped if printing length > n', function () {
      const longAnsiString = '\u001B[31m123456789\u001B[39m' // "123456789" in red

      expect(addNewlineAtEveryNChar(longAnsiString, 3)).to.eq('123\n456\n789')
    })
  })
})
