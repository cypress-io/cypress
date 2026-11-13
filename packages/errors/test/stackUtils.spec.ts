import { describe, it, expect } from 'vitest'
import { parseStackLine, splitStack, stackLineRegex } from '../src/stackUtils'

describe('src/stackUtils', () => {
  describe('stackLineRegex', () => {
    it.each([
      '    at foo (http://localhost:3000/__cypress/tests?p=cypress/e2e/a.cy.js:12:5)',
      '    at http://localhost:3000/__cypress/runner/cypress_runner.js:1:2',
      'foo@http://localhost:3000/__cypress/runner/cypress_runner.js:1:2',
      '@http://localhost:3000/a.js:10:20',
      '    at <unknown>',
      '    at Array.map ([native code])',
      'map@[native code]',
      'webpack:///./cypress/e2e/a.cy.js:10:20',
    ])('matches stack line %s', (line) => {
      expect(stackLineRegex.test(line)).toBe(true)
    })

    it.each([
      'AssertionError: expected true to be false',
      'Error: boom',
      '    at foo (a.js:1:2) and more text',
      '',
    ])('does not match message line %s', (line) => {
      expect(stackLineRegex.test(line)).toBe(false)
    })

    it('tests a very long message line in linear time', () => {
      const line = `AssertionError: expected <body> to contain text 'Noted.', but the text was '${'word '.repeat(30000)}'`

      const start = performance.now()

      expect(stackLineRegex.test(line)).toBe(false)
      expect(performance.now() - start).toBeLessThan(1000)
    })
  })

  describe('parseStackLine', () => {
    it.each([
      ['Chrome frame', '    at foo (/home/me/proj/cypress.config.ts:12:5)', { absolute: '/home/me/proj/cypress.config.ts', line: 12, column: 5 }],
      ['frame without leading whitespace', 'at foo (/a/b.js:1:2)', { absolute: '/a/b.js', line: 1, column: 2 }],
      ['constructor frame', '    at new Foo (/a.js:12:34)', { absolute: '/a.js', line: 12, column: 34 }],
      ['anonymous object frame', '    at Object.<anonymous> (/a/b.js:3:4)', { absolute: '/a/b.js', line: 3, column: 4 }],
      ['Windows drive letter', '    at Object.<anonymous> (C:\\Users\\me\\proj\\cypress.config.ts:10:5)', { absolute: 'C:\\Users\\me\\proj\\cypress.config.ts', line: 10, column: 5 }],
      ['path with spaces', '    at fn (/my projects/app dir/a.js:1:2)', { absolute: '/my projects/app dir/a.js', line: 1, column: 2 }],
      ['file URL', '    at fn (file:///a/b.mjs:3:4)', { absolute: 'file:///a/b.mjs', line: 3, column: 4 }],
      ['node internal', '    at fn (node:internal/modules/cjs/loader:1:2)', { absolute: 'node:internal/modules/cjs/loader', line: 1, column: 2 }],
      ['webpack URL with query', '    at fn (webpack:///./src/a.ts?1234:5:6)', { absolute: 'webpack:///./src/a.ts?1234', line: 5, column: 6 }],
      ['extra colons kept in path', '    at fn (a:1:2:3)', { absolute: 'a:1', line: 2, column: 3 }],
      ['missing closing paren', '    at fn (/a.js:1:2', { absolute: '/a.js', line: 1, column: 2 }],
      ['leading zeros', '(a:01:002)', { absolute: 'a', line: 1, column: 2 }],
      ['leading newline', '\n  at fn (/a.js:1:2)', { absolute: '/a.js', line: 1, column: 2 }],
      ['leading non-breaking space and BOM', '\u00a0\ufeffat fn (/a.js:1:2)', { absolute: '/a.js', line: 1, column: 2 }],
      // The path starts after the last `(`, so nested frames or parenthesized directories distort it
      ['eval frame', 'at eval (eval at <anonymous> (/a.js:1:2), <anonymous>:3:4)', { absolute: '/a.js:1:2), <anonymous>', line: 3, column: 4 }],
      ['parentheses in the path', '    at fn (C:\\Program Files (x86)\\proj\\a.js:1:2)', { absolute: 'x86)\\proj\\a.js', line: 1, column: 2 }],
    ])('parses %s', (_name, input, expected) => {
      expect(parseStackLine(input)).toEqual(expected)
    })

    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['message line', 'Error: boom'],
      ['Firefox frame', 'fn@http://localhost:3000/a.js:1:2'],
      ['frame without parentheses', '    at /a/b.js:1:2'],
      ['Windows frame without parentheses', '    at C:\\Users\\me\\proj\\cypress.config.ts:10:5'],
      ['frame without location', '    at async Promise.all (index 0)'],
      ['line without column', '    at fn (/a.js:1)'],
      ['empty path', '    at fn (:1:2)'],
      ['trailing text', '    at fn (/a.js:1:2) '],
      ['two closing parens', '    at fn (/a.js:1:2))'],
      ['multi-line input', 'Error: boom\n    at fn (/a.js:1:2)'],
      ['newline inside the path', '  at fn (/a\n.js:1:2)'],
      ['trailing newline', '  at fn (/a.js:1:2)\n'],
      ['line separator inside the path', 'at fn (/a\u2028.js:1:2)'],
    ])('returns null for %s', (_name, input) => {
      expect(parseStackLine(input)).toBeNull()
    })

    it('parses a frame with a very long path', () => {
      const path = `/${'a ('.repeat(16666)}b.js`

      expect(parseStackLine(`    at fn (${path}:1:2)`)).toEqual({ absolute: 'b.js', line: 1, column: 2 })
    })

    it('rejects a long adversarial line in linear time', () => {
      const line = `${' '.repeat(25000)}${'('.repeat(25000)} `
      const start = performance.now()

      expect(parseStackLine(line)).toBeNull()
      expect(performance.now() - start).toBeLessThan(1000)
    })
  })

  describe('splitStack', () => {
    it('splits a long message from its stack lines', () => {
      const message = `Error: ${'word '.repeat(30000)}`
      const stackLine = '    at foo (http://localhost:3000/a.js:1:2)'

      const [messageLines, stackLines] = splitStack(`${message}\n${stackLine}`)

      expect(messageLines).toEqual([message])
      expect(stackLines).toEqual([stackLine])
    })
  })
})
