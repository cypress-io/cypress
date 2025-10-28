import { describe, it, expect } from 'vitest'
import {
  _restoreMatcherOptionsTypes,
} from '../../lib/server/driver-events'

describe('driver events', function () {
  describe('._restoreMatcherOptionsTypes', function () {
    it('rehydrates regexes properly', function () {
      const { url } = _restoreMatcherOptionsTypes({
        url: {
          type: 'regex',
          value: '/aaa/igm',
        },
      })

      expect(url).toBeInstanceOf(RegExp)
      expect(url).toMatchObject({
        flags: 'gim',
        source: 'aaa',
      })
    })
  })
})
