import { expect } from 'chai'

const { buildWorstCaseInput, parseRegexArg } = require('../check-regex')

describe('check-regex', () => {
  describe('parseRegexArg', () => {
    it('splits a regex literal into source and flags', () => {
      expect(parseRegexArg('/^\\s+\\S[^\\s:]*:/u')).to.deep.equal({ source: '^\\s+\\S[^\\s:]*:', flags: 'u' })
    })

    it('keeps slashes inside the source', () => {
      expect(parseRegexArg('/^https?:\\/\\/[^/]+/i')).to.deep.equal({ source: '^https?:\\/\\/[^/]+', flags: 'i' })
    })

    it('treats anything else as a bare source', () => {
      expect(parseRegexArg(':(\\d+):(\\d+)\\)?$')).to.deep.equal({ source: ':(\\d+):(\\d+)\\)?$', flags: '' })
    })
  })

  describe('buildWorstCaseInput', () => {
    // recheck 4.6.2's worst-case input for /^\s*(?:at )?.*@?\((.*?):(\d+):(\d+)\)?$/
    const recipe = {
      pumps: [{ prefix: '', pump: ' ', bias: 0 }, { prefix: '', pump: '(', bias: 0 }],
      suffix: ' ',
      base: 1651,
    }

    it('rebuilds recheck\'s own string at its base length', () => {
      expect(buildWorstCaseInput(recipe, 3303)).to.equal(`${' '.repeat(1651)}${'('.repeat(1651)} `)
    })

    it('scales to the requested length', () => {
      const str = buildWorstCaseInput(recipe, 50_000)

      expect(str.length).to.be.within(49_998, 50_000)
      expect(str.startsWith(' '.repeat(24_999))).to.be.true
    })

    it('honours prefixes and bias', () => {
      expect(buildWorstCaseInput({ pumps: [{ prefix: 'x', pump: 'ab', bias: 1 }], suffix: '!' }, 10)).to.equal('xabababab!')
    })
  })
})
