require('../spec_helper')

const la = require('lazy-ass')
const { stripIndent, stripIndents } = require('common-tags')
const snapshot = require('../support/snapshot')

describe('stripIndent', () => {
  it('removes indent from literal string', () => {
    const removed = stripIndent`
      first line
        second line
          third line
      last line
    `

    // should preserve the structure of the text
    snapshot(removed)
  })

  it('can be called as a function', () => {
    const text = '  foo\n    bar\n'
    const removed = stripIndent(text)
    // removed 1 level of indentation and trimmed the string
    const expected = 'foo\n  bar'

    la(removed === expected, `removed indent is\n${removed}`)
  })

  it('can be used with nested message', () => {
    const nested = stripIndents('    foo\n    bar\n')
    const str = stripIndents`
      first line

      ${nested}

      last line
    `

    // should have NO indents
    // first line
    //
    // foo
    // bar
    //
    // last line
    snapshot(str)
  })
})
