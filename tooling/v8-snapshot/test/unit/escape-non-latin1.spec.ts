import { expect } from 'chai'
import vm from 'vm'
import { assertLatin1, escapeNonLatin1 } from '../../src/generator/escape-non-latin1'

const evaluate = (source: string) => vm.runInNewContext(source)
const escape = (source: string) => escapeNonLatin1(source).code
const LATIN1 = /^[\0-\xff]*$/

describe('escapeNonLatin1', () => {
  it('leaves Latin-1 source untouched', () => {
    const source = 'var s = "caf\xe9 \xff"'

    expect(escapeNonLatin1(source)).to.deep.equal({ code: source, edits: [] })
  })

  it('escapes chars in strings, regexes, untagged templates and comments without changing behavior', () => {
    const source = [
      'var re = /[\u2018\u201C!%&^<=>`]/',
      '// s\u2019adagia',
      '/* \u2019 */',
      'var s = "x\u2032y\u2033"',
      'var t = `a\u2019${1}b`',
      '[re.test("\u2018"), re.test("a"), s, t]',
    ].join('\n')

    const escaped = escape(source)

    expect(escaped).to.match(LATIN1)
    expect(escaped).to.contain('/[\\u2018\\u201C!%&^<=>`]/')
    expect(evaluate(escaped)).to.deep.equal(evaluate(source))
  })

  it('escapes astral chars as surrogate pairs', () => {
    const source = 'var s = "\u{1F600}"; var re = /^\u{1F600}$/u; [s, s.length, re.test(s)]'
    const escaped = escape(source)

    expect(escaped).to.contain('"\\uD83D\\uDE00"')
    expect(evaluate(escaped)).to.deep.equal(['\u{1F600}', 2, true])
  })

  it('escapes chars in identifiers', () => {
    const source = 'var \xf1and\xfa\u03C0 = 1; var \u03C0 = 2; class A { #\u03C0 = 3; get () { return this.#\u03C0 } } \xf1and\xfa\u03C0 + \u03C0 + new A().get()'
    const escaped = escape(source)

    expect(escaped).to.match(LATIN1)
    expect(evaluate(escaped)).to.equal(6)
  })

  it('replaces an identity escape of the char rather than escaping the backslash', () => {
    const source = '["\\\u2019", "\\\\\u2019", /\\\u2019/.test("\u2019")]'
    const escaped = escape(source)

    expect(escaped).to.equal('["\\u2019", "\\\\\\u2019", /\\u2019/.test("\\u2019")]')
    expect(evaluate(escaped)).to.deep.equal(evaluate(source))
  })

  it('keeps a line separator ending a `//` comment as a line break', () => {
    const source = 'var r = 1 // note\u2028r = 2\nr'
    const escaped = escape(source)

    expect(escaped).to.equal('var r = 1 // note\nr = 2\nr')
    expect(evaluate(escaped)).to.equal(2)
  })

  it('keeps a line separator in a block comment as a line break for automatic semicolon insertion', () => {
    const source = 'var a = 1, b = 2\na /*\u2029*/ ++b\n[a, b]'
    const escaped = escape(source)

    expect(escaped).to.match(LATIN1)
    expect(evaluate(escaped)).to.deep.equal(evaluate(source))
  })

  it('removes a line continuation made with a line separator', () => {
    const source = '["a\\\u2028b", `c\\\u2029d`, "e\u2028f"]'
    const escaped = escape(source)

    expect(escaped).to.equal('["ab", `cd`, "e\\u2028f"]')
    expect(evaluate(escaped)).to.deep.equal(['ab', 'cd', 'e\u2028f'])
  })

  it('replaces whitespace and line separators between tokens', () => {
    const source = 'var\u2003x = 3\u3000;\uFEFFvar y = x\u2028y'
    const escaped = escape(source)

    expect(escaped).to.equal('var x = 3 ; var y = x\ny')
    expect(evaluate(escaped)).to.equal(3)
  })

  it('escapes chars in the substitutions of a tagged template', () => {
    const source = 'String.raw`a${"\u2019"}b`'
    const escaped = escape(source)

    expect(escaped).to.equal('String.raw`a${"\\u2019"}b`')
    expect(evaluate(escaped)).to.equal('a\u2019b')
  })

  it('throws for a char inside a tagged template', () => {
    expect(() => escape('var s = String.raw`a\u2019b`')).to.throw(/inside a tagged template.*at line 1, column 21/)
  })

  it('throws for an astral char in an identifier', () => {
    expect(() => escape('var \u{1D465} = 1')).to.throw(/astral character in an identifier/)
    expect(() => escape('class A { #\u{1D465} = 1 }')).to.throw(/astral character in an identifier/)
  })

  it('reports where each replacement changed the length or added a line break', () => {
    const source = 'a = "\u2019" // \u2028\nb = "\\\u2028"'

    expect(escapeNonLatin1(source).edits).to.deep.equal([
      { index: 5, delta: 5 },
      { index: 11, delta: 0, lineBreak: true },
      { index: 18, delta: -2 },
    ])
  })
})

describe('assertLatin1', () => {
  it('passes Latin-1 source', () => {
    expect(() => assertLatin1('var s = "\\u2019 caf\xe9"', 'snapshot.js')).not.to.throw()
  })

  it('reports the location of a char above U+00FF', () => {
    expect(() => assertLatin1('var a\nvar s = "\u2019"', 'snapshot.js')).to.throw(/snapshot\.js contains a character above U\+00FF at line 2, column 10/)
  })
})
