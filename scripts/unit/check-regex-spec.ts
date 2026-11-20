import { expect } from 'chai'

const { buildAttackString, findRegexesOnLine, parsePatternArg } = require('../check-regex')

describe('check-regex', () => {
  describe('parsePatternArg', () => {
    it('splits a regex literal into source and flags', () => {
      expect(parsePatternArg('/^\\s+\\S[^\\s:]*:/u')).to.deep.equal({ source: '^\\s+\\S[^\\s:]*:', flags: 'u' })
    })

    it('keeps slashes inside the source', () => {
      expect(parsePatternArg('/^https?:\\/\\/[^/]+/i')).to.deep.equal({ source: '^https?:\\/\\/[^/]+', flags: 'i' })
    })

    it('treats anything else as a bare source', () => {
      expect(parsePatternArg(':(\\d+):(\\d+)\\)?$')).to.deep.equal({ source: ':(\\d+):(\\d+)\\)?$', flags: '' })
    })
  })

  describe('findRegexesOnLine', () => {
    const code = [
      `import { foo } from './foo'`,
      `const stackLineLocationRegex = /:(\\d+):(\\d+)\\)?$/`,
      `const ratio = total / count / 2`,
      `const DEBUG_PREFIX = new RegExp('^\\\\s+\\\\S[^\\\\s:]*:', 'u')`,
      `const fromVariable = new RegExp(pattern, 'g')`,
      `const pair = [/a+/g, RegExp(\`b\`)]`,
    ].join('\n')

    it('finds a regex literal', () => {
      expect(findRegexesOnLine(code, 2)).to.deep.equal([
        { source: ':(\\d+):(\\d+)\\)?$', flags: '', label: '/:(\\d+):(\\d+)\\)?$/' },
      ])
    })

    it('does not mistake division for a regex', () => {
      expect(findRegexesOnLine(code, 3)).to.deep.equal([])
    })

    it('reads RegExp() calls with string literal arguments', () => {
      expect(findRegexesOnLine(code, 4)).to.deep.equal([
        { source: '^\\s+\\S[^\\s:]*:', flags: 'u', label: `new RegExp('^\\\\s+\\\\S[^\\\\s:]*:', 'u')` },
      ])
    })

    it('skips a RegExp() built from a variable', () => {
      expect(findRegexesOnLine(code, 5)).to.deep.equal([])
    })

    it('returns every regex on the line', () => {
      expect(findRegexesOnLine(code, 6).map((t) => t.label)).to.deep.equal(['/a+/g', 'RegExp(`b`)'])
    })
  })

  describe('buildAttackString', () => {
    // recheck 4.6.2's attack for /^\s*(?:at )?.*@?\((.*?):(\d+):(\d+)\)?$/
    const attack = {
      pumps: [{ prefix: '', pump: ' ', bias: 0 }, { prefix: '', pump: '(', bias: 0 }],
      suffix: ' ',
      base: 1651,
    }

    it('rebuilds recheck\'s own string at its base length', () => {
      expect(buildAttackString(attack, 3303)).to.equal(`${' '.repeat(1651)}${'('.repeat(1651)} `)
    })

    it('scales to the requested length', () => {
      const str = buildAttackString(attack, 50_000)

      expect(str.length).to.be.within(49_998, 50_000)
      expect(str.startsWith(' '.repeat(24_999))).to.be.true
    })

    it('honours prefixes and bias', () => {
      expect(buildAttackString({ pumps: [{ prefix: 'x', pump: 'ab', bias: 1 }], suffix: '!' }, 10)).to.equal('xabababab!')
    })
  })
})
