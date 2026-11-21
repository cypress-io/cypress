import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { countsLine, definitionList, emptyState, heading, indent, layout, quoted, stateBadge, table, titleLine, trimTrailingNewlines } from '../../../lib/tap/render/format'

// chalk's color level depends on where the suite runs, so strip escape codes
// before asserting — these target the shared layout, not the colors.
const plain = (value: string): string => stripAnsi(value)
const plainLines = (lines: string[]): string[] => lines.map(plain)

describe('lib/tap/render/format', () => {
  describe('heading', () => {
    it('renders a bare title, and a title with its count', () => {
      expect(plain(heading('ROUTES'))).toBe('ROUTES')
      expect(plain(heading('ROUTES', 3))).toBe('ROUTES (3)')
    })
  })

  describe('titleLine', () => {
    it('leads with the icon and appends the suffix when present', () => {
      expect(plain(titleLine('▶', 'login.cy.ts'))).toBe('▶ login.cy.ts')
      expect(plain(titleLine('✓', 'login.cy.ts', 'passed'))).toBe('✓ login.cy.ts  passed')
    })
  })

  describe('countsLine', () => {
    it('renders each outcome, zero as `--`, and skipped only when non-zero', () => {
      expect(plain(countsLine({ passed: 2, failed: 0, pending: 1, skipped: 0 }))).toBe(`${plain(stateBadge.passed.icon)} 2  ${plain(stateBadge.failed.icon)} --  ${plain(stateBadge.pending.icon)} 1`)
      expect(plain(countsLine({ passed: 2, failed: 1, pending: 0, skipped: 3 }))).toContain('- 3')
    })
  })

  describe('table', () => {
    it('renders a counted heading and pads columns to their widest cell', () => {
      const rendered = plain(layout([table('SESSIONS', ['PID', 'TYPE'], [['111', 'e2e'], ['2', 'component']])]))

      expect(rendered).toBe([
        'SESSIONS (2)',
        '  PID  TYPE',
        '  111  e2e',
        '  2    component',
      ].join('\n'))
    })

    it('applies the optional colorize to each padded row', () => {
      const rows = table('T', ['A'], [['x']], (cells) => cells.map((cell) => `<${cell}>`))

      expect(plain(rows[2])).toBe('  <x>')
    })
  })

  describe('definitionList', () => {
    it('aligns values past the widest label', () => {
      expect(plainLines(definitionList([['pid', '4242'], ['testing type', 'e2e']]))).toEqual([
        '  pid           4242',
        '  testing type  e2e',
      ])
    })
  })

  describe('quoted', () => {
    it('single-quotes a selector, leaving its double-quoted attribute values alone', () => {
      expect(quoted(String.raw`[data-test="x"]`)).toBe(String.raw`'[data-test="x"]'`)
    })

    it('escapes a single quote so the whole selector stays one shell argument', () => {
      expect(quoted(String.raw`[data-cy="Bob's item"]`)).toBe(String.raw`'[data-cy="Bob'\''s item"]'`)
      expect(quoted(String.raw`[title='x']`)).toBe(String.raw`'[title='\''x'\'']'`)
    })
  })

  describe('indent', () => {
    it('nests by two spaces per level', () => {
      expect(indent(0)).toBe('')
      expect(indent(2)).toBe('    ')
    })
  })

  describe('layout', () => {
    it('separates blocks with a blank line and trims trailing whitespace', () => {
      expect(plain(layout([['a  ', 'b'], [emptyState('c')]]))).toBe('a\nb\n\nc')
    })
  })

  describe('trimTrailingNewlines', () => {
    // A code frame as the driver reports it for a failed `should`, trailing newline included.
    const codeFrame = `  56 |     // https://on.cypress.io/clear\n  57 |     cy.get(".action-select").type("Clear this text");\n> 58 |     cy.get(".action-clear").should("have.value", "Clear this text");\n     |                             ^\n  59 |     cy.get(".action-clear").clear();\n`

    it.each([
      ['a code frame with one trailing newline', codeFrame, codeFrame.slice(0, -1)],
      ['several trailing newlines', `${codeFrame}\n\n`, codeFrame.slice(0, -1)],
      ['no trailing newline', codeFrame.slice(0, -1), codeFrame.slice(0, -1)],
      ['an empty string', '', ''],
      ['only newlines', '\n\n\n', ''],
      ['blank lines inside the frame', '  1 | a\n\n  2 | b\n', '  1 | a\n\n  2 | b'],
      ['a Windows line ending, whose \\r stays', '  1 | a\r\n', '  1 | a\r'],
      ['trailing spaces after the last newline', '  1 | a\n  ', '  1 | a\n  '],
    ])('matches /\\n+$/ for %s', (_label, input, expected) => {
      expect(trimTrailingNewlines(input)).toBe(expected)
      expect(trimTrailingNewlines(input)).toBe(input.replace(/\n+$/, ''))
    })

    it('trims 50,000 newline runs that stop short of the end in linear time', () => {
      const input = `${'\n'.repeat(50_000)}x`
      const start = performance.now()

      expect(trimTrailingNewlines(input)).toBe(input)
      expect(performance.now() - start).toBeLessThan(200)
    })
  })
})
