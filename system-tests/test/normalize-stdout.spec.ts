import { expect } from 'chai'
import { normalizeStdout, replaceStackTraceLines, STDOUT_DURATION_IN_TABLES_RE } from '../lib/normalizeStdout'

describe('normalizeStdout', () => {
  context('browser connect retries', () => {
    it('removes the connect-retry line', () => {
      const input = [
        '  Running:  simple_spec.cy.js',
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 3/62)',
        '  1 passing',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  Running:  simple_spec.cy.js',
        '  1 passing',
        '',
      ].join('\n'))
    })

    it('removes every connect-retry line in a run', () => {
      const input = [
        '  Running:  simple_spec.cy.js',
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 18/62)',
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 19/62)',
        'Still waiting to connect to Firefox, retrying in 1 second (attempt 20/62)',
        '  1 passing',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  Running:  simple_spec.cy.js',
        '  1 passing',
        '',
      ].join('\n'))
    })

    it('removes the connect-retry line when it ends in CRLF', () => {
      const input = 'a\r\nStill waiting to connect to Chrome, retrying in 1 second (attempt 3/62)\r\nb\r\n'

      expect(normalizeStdout(input)).to.eq('a\nb\n')
    })

    it('keeps a similar line whose counter is not an attempt count', () => {
      const input = 'Still waiting to connect to Chrome, retrying in 1 second (attempt three of many)\n'

      expect(normalizeStdout(input)).to.include('Still waiting to connect to Chrome')
      .and.to.include('(attempt three of many)')
    })

    it('removes connect-retry lines between browser-connect timeouts the run recovered from', () => {
      const input = [
        '  Running:  simple_spec.cy.js',
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 18/62)',
        '',
        'Timed out waiting for the browser to connect. Retrying...',
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 18/62)',
        '',
        'Timed out waiting for the browser to connect. Retrying again...',
        '',
        '  1 passing',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  Running:  simple_spec.cy.js',
        '',
        '  1 passing',
        '',
      ].join('\n'))
    })

    it('leaves the rewrites of neighbouring lines intact', () => {
      const input = [
        'Still waiting to connect to Chrome, retrying in 1 second (attempt 18/62)',
        '  │ Duration:     5 seconds                │',
        '  │ Spec Ran:     simple_spec.cy.js        │',
        '  ✔  All specs passed!                        123ms        1        1',
        '',
      ].join('\n')

      expect(normalizeStdout(input)).to.eq([
        '  │ Duration:     X seconds                │',
        '  │ Spec Ran:     simple_spec.cy.js        │',
        '  ✔  All specs passed!                        XX:XX        1        1',
        '',
      ].join('\n'))
    })
  })

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
    // The failure header, and the blank lines and `(Results)` that follow the stack, are from the
    // "deterministic flaky test" output in system-tests/__snapshots__/experimental_retries.spec.ts.js,
    // which stores it with the stack already collapsed
    const failureHeader = [
      '  1) deterministic flaky test',
      '       deterministically runs pass/fail on this test:',
      '     AssertionError: expected true to be false',
    ]

    it('collapses a chrome-style stack up to the next blank line', () => {
      // First five frames of the chrome dev e2e scenario in
      // packages/driver/test/unit/cypress/__fixtures__/getUserInvocationStack_stackFrames.json
      const stack = [
        '    at Context.eval (http://localhost:53021/__cypress/tests?p=cypress/spec.cy.js:14:16)',
        '    at __stackReplacementMarker (cypress:///../driver/src/cypress/cy.ts:85:13)',
        '    at runnable.fn (cypress:///../driver/src/cypress/cy.ts:872:19)',
        '    at callFn (cypress:///../driver/node_modules/mocha/lib/runnable.js:394:21)',
        '    at Runnable.run (cypress:///../driver/node_modules/mocha/lib/runnable.js:381:7)',
      ]
      const input = [...failureHeader, ...stack, '', '', '', '', '  (Results)', ''].join('\n')

      expect(replaceStackTraceLines(input, 'chrome')).to.eq([
        ...failureHeader,
        '      [stack trace lines]',
        '',
        '',
        '',
        '',
        '  (Results)',
        '',
      ].join('\n'))
    })

    it('collapses a firefox-style stack up to the end of the output', () => {
      // First five frames of the firefox binary e2e scenario in
      // packages/driver/test/unit/cypress/__fixtures__/getUserInvocationStack_stackFrames.json
      const stack = [
        '@http://localhost:54823/__cypress/tests?p=cypress/spec.cy.js:14:16',
        '__stackReplacementMarker@http://localhost:54823/__cypress/runner/cypress_runner.js:136677:13',
        '__webpack_modules__</setRunnable/runnable.fn@http://localhost:54823/__cypress/runner/cypress_runner.js:137464:43',
        'callFn@http://localhost:54823/__cypress/runner/cypress_runner.js:156061:21',
        '__webpack_modules__</Runnable.prototype.run@http://localhost:54823/__cypress/runner/cypress_runner.js:156048:13',
      ]
      const input = [...failureHeader, ...stack, ''].join('\n')

      expect(replaceStackTraceLines(input, 'firefox')).to.eq([...failureHeader, '      [stack trace lines]'].join('\n'))
    })
  })
})
