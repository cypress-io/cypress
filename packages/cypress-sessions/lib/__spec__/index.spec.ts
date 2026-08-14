import { describe, it, expect } from 'vitest'
import {
  isCompatibleRecord,
  isTapSupportedBrowser,
  recordFileName,
  parseRecordPid,
  sessionProbePath,
  buildTapSchema,
  SESSIONS_ROUTE_PREFIX,
  SESSIONS_DIRNAME,
  SCHEMA_VERSION,
  TAP_COMMANDS,
} from '../index'

const validRecord = {
  schemaVersion: SCHEMA_VERSION,
  pid: 1234,
  projectRoot: '/projects/app',
  serverPort: 5000,
  sessionId: 'a1b2c3d4-0000-4000-8000-000000000000',
  testingType: 'e2e',
}

describe('cypress-sessions contract', () => {
  describe('isCompatibleRecord', () => {
    it('accepts a well-formed record', () => {
      expect(isCompatibleRecord(validRecord)).toBe(true)
    })

    it('accepts e2e, component, and null testing types', () => {
      expect(isCompatibleRecord({ ...validRecord, testingType: 'component' })).toBe(true)
      expect(isCompatibleRecord({ ...validRecord, testingType: null })).toBe(true)
    })

    it('rejects falsy, malformed, or older-schema records', () => {
      expect(isCompatibleRecord(null)).toBe(false)
      expect(isCompatibleRecord({ ...validRecord, schemaVersion: 0 })).toBe(false)
      expect(isCompatibleRecord({ ...validRecord, serverPort: 1.5 })).toBe(false)
      expect(isCompatibleRecord({ ...validRecord, sessionId: '' })).toBe(false)
      expect(isCompatibleRecord({ ...validRecord, testingType: 'nope' })).toBe(false)
    })
  })

  describe('record filename helpers', () => {
    it('round-trips a pid through the filename', () => {
      expect(recordFileName(1234)).toBe('1234.json')
      expect(parseRecordPid('1234.json')).toBe(1234)
    })

    it('returns null for non-record filenames', () => {
      expect(parseRecordPid('notes.txt')).toBeNull()
      expect(parseRecordPid('1234.json.tmp')).toBeNull()
      expect(parseRecordPid('not-a-pid.json')).toBeNull()
    })
  })

  describe('probe route', () => {
    it('builds the probe path from the shared prefix', () => {
      expect(sessionProbePath('abc')).toBe(`${SESSIONS_ROUTE_PREFIX}abc`)
      expect(sessionProbePath('abc')).toBe('/__cypress/sessions/abc')
    })
  })

  it('exposes the sessions dir name', () => {
    expect(SESSIONS_DIRNAME).toBe('sessions')
  })

  describe('isTapSupportedBrowser', () => {
    it('accepts Chromium and rejects every other family', () => {
      expect(isTapSupportedBrowser('chromium')).toBe(true)
      expect(isTapSupportedBrowser('firefox')).toBe(false)
      expect(isTapSupportedBrowser('webkit')).toBe(false)
    })

    // No browser open, or a record written before the family was reported — in
    // neither case is there a browser to call unsupported.
    it('accepts a null family', () => {
      expect(isTapSupportedBrowser(null)).toBe(true)
    })
  })

  describe('tap command contract', () => {
    it('lists reporter as a command taking --test-id and --attempt, advertised on the wire schema', () => {
      const reporter = TAP_COMMANDS.find(({ name }) => name === 'reporter')!

      expect(reporter.params).toEqual([])
      expect(reporter.options.map(({ name, required }) => ({ name, required }))).toEqual([
        { name: 'test-id', required: false },
        { name: 'attempt', required: false },
      ])

      const advertised = buildTapSchema('15.0.0').commands.find(({ name }) => name === 'reporter')

      expect(advertised).toBeDefined()
      expect(advertised!.details).toBe(reporter.details)
    })

    it('advertises every option a command declares', () => {
      const command = TAP_COMMANDS.find(({ name }) => name === 'command')!
      const advertised = buildTapSchema('15.0.0').commands.find(({ name }) => name === 'command')!

      expect(advertised.options.map(({ name }) => name)).toContain('depth')
      expect(advertised.options.map(({ name }) => name)).toEqual(command.options.map(({ name }) => name))
    })
  })
})
