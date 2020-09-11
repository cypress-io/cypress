import {
  _restoreMatcherOptionsTypes,
} from '../../lib/server/driver-events'
import { expect } from 'chai'

describe('driver events', function () {
  context('._restoreMatcherOptionsTypes', function () {
    it('rehydrates regexes properly', function () {
      const { url } = _restoreMatcherOptionsTypes({
        url: {
          type: 'regex',
          value: '/aaa/igm',
        },
      })

      expect(url).to.be.instanceOf(RegExp)
      .and.include({
        flags: 'gim',
        source: 'aaa',
      })
    })
  })
})
