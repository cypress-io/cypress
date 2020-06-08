require('../spec_helper')

const duration = require(`${root}lib/util/duration`)

describe('lib/util/duration', () => {
  context('.format', () => {
    it('formats ms', () => {
      expect(duration.format(496)).to.eq('496ms')
    })

    it('formats 1 digit secs', () => {
      expect(duration.format(1000)).to.eq('00:01')
    })

    it('formats 2 digit secs', () => {
      expect(duration.format(21000)).to.eq('00:21')
    })

    it('formats mins and secs', () => {
      expect(duration.format(321000)).to.eq('05:21')
    })

    it('formats 2 digit mins and secs', () => {
      expect(duration.format(3330000)).to.eq('55:30')
    })

    it('formats hours with mins', () => {
      expect(duration.format(33300000)).to.eq('9:15:00')
    })
  })
})
