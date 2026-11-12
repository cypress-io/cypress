import { expect } from 'chai'
import vm from 'vm'
import { assertLatin1, escapeNonLatin1 } from '../../src/generator/escape-non-latin1'

const evaluate = (source: string) => vm.runInNewContext(source)

describe('escapeNonLatin1', () => {
  it('leaves Latin-1 source untouched', () => {
    const source = 'var s = "caf\xe9 \xff"'

    expect(escapeNonLatin1(source)).to.equal(source)
  })

  it('escapes chars in strings, regexes, untagged templates and comments without changing behavior', () => {
    const source = [
      'var re = /[‘“!%&^<=>`]/',
      '// s’adagia',
      'var s = "x′y″"',
      'var t = `a’${1}b`',
      '[re.test("‘"), re.test("a"), s, t]',
    ].join('\n')

    const escaped = escapeNonLatin1(source)

    expect(escaped).to.match(/^[\0-\xff]*$/)
    expect(escaped).to.contain('/[\\u2018\\u201C!%&^<=>`]/')
    expect(evaluate(escaped)).to.deep.equal(evaluate(source))
  })

  it('escapes astral chars as surrogate pairs', () => {
    const source = 'var s = "😀"; var re = /^😀$/u; [s, s.length, re.test(s)]'
    const escaped = escapeNonLatin1(source)

    expect(escaped).to.contain('"\\uD83D\\uDE00"')
    expect(evaluate(escaped)).to.deep.equal(['😀', 2, true])
  })

  it('escapes chars in identifiers', () => {
    const source = 'var ñandú = 1; var π = 2; ñandú + π'
    const escaped = escapeNonLatin1(source)

    expect(escaped).to.match(/^[\0-\xff]*$/)
    expect(evaluate(escaped)).to.equal(3)
  })

  it('replaces an identity escape of the char rather than escaping the backslash', () => {
    const source = '["\\’", "\\\\’", /\\’/.test("’")]'
    const escaped = escapeNonLatin1(source)

    expect(escaped).to.equal('["\\u2019", "\\\\\\u2019", /\\u2019/.test("\\u2019")]')
    expect(evaluate(escaped)).to.deep.equal(evaluate(source))
  })

  it('throws for a char inside a tagged template', () => {
    expect(() => escapeNonLatin1('var s = String.raw`a’b`')).to.throw(/inside a tagged template\) at line 1/)
  })

  it('escapes chars in the substitutions of a tagged template', () => {
    const source = 'String.raw`a${"’"}b`'
    const escaped = escapeNonLatin1(source)

    expect(escaped).to.equal('String.raw`a${"\\u2019"}b`')
    expect(evaluate(escaped)).to.equal('a’b')
  })

  it('throws for an astral char in an identifier', () => {
    expect(() => escapeNonLatin1('var 𝑥 = 1')).to.throw(/astral character in an identifier/)
  })
})

describe('assertLatin1', () => {
  it('passes Latin-1 source', () => {
    expect(() => assertLatin1('var s = "\\u2019 caf\xe9"', 'snapshot.js')).not.to.throw()
  })

  it('reports the location of a char above U+00FF', () => {
    expect(() => assertLatin1('var a\nvar s = "’"', 'snapshot.js')).to.throw(/snapshot\.js contains a character above U\+00FF at line 2, column 10/)
  })
})
