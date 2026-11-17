import { expect } from 'chai'
import { normalizeStdout, replaceStackTraceLines, STDOUT_DURATION_IN_TABLES_RE } from '../lib/normalizeStdout'

describe('normalizeStdout', () => {
  context('durations in tables', () => {
    it('replaces ms and clock durations, keeping the column width', () => {
      const input = [
        '  │ ✔  simple_spec.cy.js                        00:01        1        1 │',
        '  ✔  All specs passed!                        123ms        1        1',
        '  Duration:     1:02:03',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  │ ✔  simple_spec.cy.js                        XX:XX        1        1 │',
        '  ✔  All specs passed!                        XX:XX        1        1',
        '  Duration:       XX:XX',
        '',
      ].join('\n'))
    })

    it('leaves durations that are not preceded by whitespace', () => {
      const input = '  spec_123ms\n'

      expect(normalizeStdout(input)).to.eq(input)
    })

    it('captures all of the whitespace before the duration', () => {
      STDOUT_DURATION_IN_TABLES_RE.lastIndex = 0

      const match = STDOUT_DURATION_IN_TABLES_RE.exec('  │ spec.cy.js     123ms │')

      STDOUT_DURATION_IN_TABLES_RE.lastIndex = 0

      expect(match && [...match]).to.deep.eq(['     123ms', '     ', '123ms'])
    })
  })

  context('short durations', () => {
    it('replaces each duration shape followed by a count', () => {
      const input = [
        '  passes in 10s 1/1',
        '  passes after 1m, 10s 2/3',
        '  passes in 12.34ms 1/1',
        '  passes in 2m 4/5',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  passes in Xm, Ys ZZ.ZZms 1/1',
        '  passes after Xm, Ys ZZ.ZZms 2/3',
        '  passes in Xm, Ys ZZ.ZZms 1/1',
        '  passes in Xm, Ys ZZ.ZZms 4/5',
        '',
      ].join('\n'))
    })
  })

  context('cross-origin errors', () => {
    it('replaces the chrome and firefox messages up to the end of their lines', () => {
      const input = [
        'Error: Blocked a frame with origin "http://localhost:3500" from accessing a cross-origin frame.',
        'next line',
        'Error: Permission denied to access property "document" on cross-origin object',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        'Error: [Cross origin error message]',
        'next line',
        'Error: [Cross origin error message]',
        '',
      ].join('\n'))
    })
  })

  context('vite dependency optimization messages', () => {
    it('removes a "Re-optimizing dependencies" line that is followed by a blank line', () => {
      const input = 'a\n  Re-optimizing dependencies because lockfile has changed\n\nb\n'

      expect(normalizeStdout(input)).to.eq('a\n\nb\n')
    })

    it('removes a "Re-optimizing dependencies" line at the end of the output', () => {
      expect(normalizeStdout('a\n  Re-optimizing dependencies because lockfile has changed\n')).to.eq('a\n')
    })

    it('keeps a "Re-optimizing dependencies" line that is followed by more output', () => {
      const input = '  Re-optimizing dependencies because lockfile has changed\nnext\n'

      expect(normalizeStdout(input)).to.eq(input)
    })

    it('strips "new dependencies optimized" after a closing paren on each line', () => {
      const input = [
        '  (Run Starting) new dependencies optimized: react, react-dom',
        'middle',
        '  (Results) new dependencies optimized: vue',
        'end',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  (Run Starting)',
        'middle',
        '  (Results)',
        'end',
      ].join('\n'))
    })
  })

  context('stack traces', () => {
    it('collapses a chrome-style stack up to the next blank line', () => {
      const input = 'Error: boom\n    at foo (http://localhost:3500/foo.js:1:2)\n    at bar (bar.js:3:4)\n\nnext\n'

      expect(replaceStackTraceLines(input, 'chrome')).to.eq('Error: boom\n      [stack trace lines]\n\nnext\n')
    })

    it('collapses a firefox-style stack up to the end of the output', () => {
      const input = 'Error: boom\nfoo@http://localhost:3500/foo.js:1:2\nbar@bar.js:3:4\n'

      expect(replaceStackTraceLines(input, 'firefox')).to.eq('Error: boom\n      [stack trace lines]')
    })
  })
})
