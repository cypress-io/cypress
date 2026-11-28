import { describe, expect, it, vi } from 'vitest'
import { callsStartingWith } from '../../support/helpers/sinon_calls'

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
})
