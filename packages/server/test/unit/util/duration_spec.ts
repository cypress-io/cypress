import '../../spec_helper'

import { format } from '../../../lib/util/duration'

describe('lib/util/duration', () => {
  describe('.format', () => {
    it('formats ms', () => {
      expect(format(496)).to.eq('496ms')
    })

    it('formats 1 digit secs', () => {
      expect(format(1000)).to.eq('00:01')
    })

    it('formats 2 digit secs', () => {
      expect(format(21000)).to.eq('00:21')
    })

    it('formats mins and secs', () => {
      expect(format(321000)).to.eq('05:21')
    })

    it('formats 2 digit mins and secs', () => {
      expect(format(3330000)).to.eq('55:30')
    })

    it('formats hours with mins', () => {
      expect(format(33300000)).to.eq('9:15:00')
    })
  })
})
