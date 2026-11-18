import { expect } from 'chai'
import { normalizeStdout } from '../lib/normalizeStdout'

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
})
