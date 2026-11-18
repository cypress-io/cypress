/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'

import { escapeMarkdown, formatMessageTemplate, removeOrKeepSingleQuotesBetweenStars } from '../../../../src/cy/chai/message_format'

// Generous enough not to flake on a slow CI box, yet far below what a
// quadratic pass over these inputs takes.
const LINEAR_TIME_BOUND_MS = 200

const timed = <T>(fn: () => T): T => {
  const start = performance.now()
  const result = fn()

  expect(performance.now() - start).toBeLessThan(LINEAR_TIME_BOUND_MS)

  return result
}

describe('src/cy/chai/message_format', () => {
  describe('formatMessageTemplate', () => {
    it.each([
      ['expected #{this} to equal #{exp}', 'expected **#{this}** to equal **#{exp}**'],
      ['expected #{this} to have property #{name} of #{exp}, but got #{act}', 'expected **#{this}** to have property **#{name}** of **#{exp}**, but got **#{act}**'],
      [`expected #{this} to have a property 'length'`, `expected **#{this}** to have a property **'length'**`],
      [`expected #{this} to match \\'quoted\\' #{exp}`, 'expected **#{this}** to match __quote__quoted__quote__ **#{exp}**'],
      ['expected #{this} to\nequal #{exp}', 'expected **#{this}** to\nequal **#{exp}**'],
      ['expected #{this} to\r\nequal #{exp}', 'expected **#{this}** to\r\nequal **#{exp}**'],
      ['expected #{this} to be **bold** #{exp}', 'expected **#{this}** to be **bold** **#{exp}**'],
      // the first character of a placeholder may be `}`
      ['expected #{} and #{}} and #{', 'expected **#{} and #{}**} and #{'],
      // a placeholder never spans lines
      ['expected #{th\nis}', 'expected #{th\nis}'],
      ['', ''],
    ])('%j', (template, expected) => {
      expect(formatMessageTemplate(template)).toBe(expected)
    })

    it('handles many unclosed placeholders in linear time', () => {
      const template = '#{'.repeat(25_000)

      expect(timed(() => formatMessageTemplate(template))).toBe(template)
    })

    it('bolds a placeholder that only closes after many openings, in linear time', () => {
      const template = `${'#{'.repeat(25_000)}}`

      expect(timed(() => formatMessageTemplate(template))).toBe(`**${template}**`)
    })
  })

  describe('removeOrKeepSingleQuotesBetweenStars', () => {
    it.each([
      [`expected **'foo'** to equal **'bar'**`, 'expected **foo** to equal **bar**'],
      [`expected **' 37:46 '** to equal **' 37:46 '**`, `expected **'&nbsp;37:46&nbsp;'** to equal **'&nbsp;37:46&nbsp;'**`],
      [`expected **'   test      '** to equal **'x'**`, `expected **'&nbsp;&nbsp;&nbsp;test&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'** to equal **'x'**`],
      [`expected **'  love'** to equal **'  love'**`, `expected **'&nbsp;&nbsp;love'** to equal **'&nbsp;&nbsp;love'**`],
      [`expected **'a\tb\n'** to equal **'\u00a0x'**`, `expected **'a\tb\n'** to equal **'&nbsp;x'**`],
      [`expected **'42'** to equal **''**`, `expected **'42'** to equal **''**`],
      [`expected **'it\\'s'** to equal **'x'**`, `expected **it's** to equal **x**`],
      [`expected **'C:\\Users\\cy\\file.txt'** to equal **'C:\\Users\\cy\\other.txt'**`, 'expected **C:\\Users\\cy\\file.txt** to equal **C:\\Users\\cy\\other.txt**'],
      [`expected **{ a: 'b' }** to have property **'a'**`, 'expected **{ a: b }** to have property **a**'],
      ['no stars here', 'no stars here'],
      ['', ''],
    ])('%j', (message, expected) => {
      expect(removeOrKeepSingleQuotesBetweenStars(message)).toBe(expected)
    })

    it('checks a value with a long inner run of whitespace in linear time', () => {
      const message = `**a${' '.repeat(50_000)}b**`

      expect(timed(() => removeOrKeepSingleQuotesBetweenStars(message))).toBe(message)
    })

    it('keeps the trailing quote after a long run of whitespace not before it, in linear time', () => {
      const spaces = ' '.repeat(50_000)

      expect(timed(() => removeOrKeepSingleQuotesBetweenStars(`**' x${spaces}y'**`))).toBe(`**'&nbsp;x${spaces}y'**`)
    })

    it('turns a long run of trailing whitespace into &nbsp; in linear time', () => {
      const message = `**'x${' '.repeat(50_000)}'**`

      expect(timed(() => removeOrKeepSingleQuotesBetweenStars(message))).toBe(`**'x${'&nbsp;'.repeat(50_000)}'**`)
    })
  })

  describe('escapeMarkdown', () => {
    it.each([
      ['expected **hello world ![JSDoc example](/slides/img/jsdoc.png)** to equal **x**', 'expected **hello world ``![JSDoc example](/slides/img/jsdoc.png)``** to equal **x**'],
      ['expected **![](C:\\Users\\cy\\img.png)** to equal **x**', 'expected **``![](C:\\Users\\cy\\img.png)``** to equal **x**'],
      ['expected **![a](b)![c](d)** to equal **![no close**', 'expected **``![a](b)````![c](d)``** to equal **![no close**'],
      // alt text runs to the first `](`, the source to the first `)` after it
      ['expected **![a]b](c)** to equal **x**', 'expected **``![a]b](c)``** to equal **x**'],
      ['expected **![a](b](c)d)** to equal **x**', 'expected **``![a](b](c)``d)** to equal **x**'],
      // an image never spans lines
      ['expected **![alt\n](src)** to equal **![alt](src\n)**', 'expected **![alt\n](src)** to equal **![alt](src\n)**'],
      ['expected **![alt\r\n](src)** to equal **x**', 'expected **![alt\r\n](src)** to equal **x**'],
      ['', ''],
    ])('%j', (message, expected) => {
      expect(escapeMarkdown(message)).toBe(expected)
    })

    it('handles many unclosed image openings in linear time', () => {
      const message = '!['.repeat(25_000)

      expect(timed(() => escapeMarkdown(message))).toBe(message)
    })

    it('handles many images with no closing parenthesis in linear time', () => {
      const message = '![]('.repeat(12_500)

      expect(timed(() => escapeMarkdown(message))).toBe(message)
    })

    it('wraps an image that only closes after many openings, in linear time', () => {
      const message = `${'!['.repeat(25_000)}](x)`

      expect(timed(() => escapeMarkdown(message))).toBe(`\`\`${message}\`\``)
    })
  })
})
