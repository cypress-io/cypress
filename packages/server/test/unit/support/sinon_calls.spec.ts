import { describe, expect, it, vi } from 'vitest'
import { callsMatching, callsStartingWith } from '../../support/helpers/sinon_calls'

const logWith = (...calls: unknown[][]) => {
  const log = vi.fn()

  for (const args of calls) {
    log(...args)
  }

  return log
}

describe('test/support/helpers/sinon_calls', () => {
  describe('callsStartingWith', () => {
    it('matches on leading arguments only', () => {
      const log = logWith(['PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123', { record: false }])

      expect(callsStartingWith(log, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION')).toHaveLength(1)
      expect(callsStartingWith(log, 'PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION', 'abc123')).toHaveLength(1)
    })

    it('compares each argument deeply', () => {
      const log = logWith([['--run-project=/home/ada/todos'], { port: 5544 }])

      expect(callsStartingWith(log, ['--run-project=/home/ada/todos'], { port: 5544 })).toHaveLength(1)
      expect(callsStartingWith(log, ['--run-project=/home/ada/todos'], { port: 2020 })).toHaveLength(0)
    })

    it('does not match when the call has fewer arguments than expected', () => {
      const log = logWith(['CLOUD_RECORD_KEY_NOT_VALID'])

      expect(callsStartingWith(log, 'CLOUD_RECORD_KEY_NOT_VALID', 'undefined')).toHaveLength(0)
    })

    it('lets an asymmetric matcher stand in for a value at any depth', () => {
      const onNewWindow = () => {}
      const log = logWith(['/home/ada/plugin-browser', { browser: 'electron', onNewWindow }])

      expect(callsStartingWith(log, '/home/ada/plugin-browser', { browser: 'electron', onNewWindow: expect.any(Function) })).toHaveLength(1)
      expect(callsStartingWith(log, expect.any(String))).toHaveLength(1)
      expect(callsStartingWith(log, expect.any(Number))).toHaveLength(0)
    })
  })

  describe('callsMatching', () => {
    it('matches a top-level string as a substring', () => {
      const log = logWith(['The following configuration option is invalid: test'])

      expect(callsMatching(log, 'configuration option is invalid')).toHaveLength(1)
      expect(callsMatching(log, 'configuration options are invalid')).toHaveLength(0)
    })

    it('tests a top-level RegExp against a string argument', () => {
      const log = logWith(['Warning: We failed to remove old browser profiles from previous runs.'])

      expect(callsMatching(log, /^Warning: .* profiles/)).toHaveLength(1)
      expect(callsMatching(log, /^Error:/)).toHaveLength(0)
    })

    it('does not match a string or RegExp against a non-string argument', () => {
      const log = logWith([new Error('Could not find a Cypress configuration file in /home/ada/todos')])

      expect(callsMatching(log, '/home/ada/todos')).toHaveLength(0)
      expect(callsMatching(log, /todos/)).toHaveLength(0)
    })

    it('matches objects on the keys they name, comparing nested values exactly', () => {
      const log = logWith([{ name: 'electron', family: 'chromium', majorVersion: 99 }, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' }])

      expect(callsMatching(log, { name: 'electron' }, { url: 'http://localhost:8888/__/#/specs/runner?file=tests/test2.js' })).toHaveLength(1)
      expect(callsMatching(log, { name: 'electron' }, { url: 'localhost:8888' })).toHaveLength(0)
      expect(callsMatching(log, { name: 'electron', majorVersion: 100 })).toHaveLength(0)
    })

    it('lets an asymmetric matcher stand in for a value at any depth', () => {
      const log = logWith(['/home/ada/plugin-browser', { browser: 'electron', onNewWindow: () => {} }])

      expect(callsMatching(log, '/home/ada/plugin-browser', { onNewWindow: expect.any(Function) })).toHaveLength(1)
      expect(callsMatching(log, '/home/ada/plugin-browser', { onNewWindow: expect.any(String) })).toHaveLength(0)
    })
  })
})
