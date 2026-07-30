import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { countsLine, definitionList, emptyState, heading, indent, layout, stateBadge, table, titleLine } from '../../../lib/tap/render/format'

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
      const rendered = plain(layout([table('INSTANCES', ['PID', 'TYPE'], [['111', 'e2e'], ['2', 'component']])]))

      expect(rendered).toBe([
        'INSTANCES (2)',
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
})
