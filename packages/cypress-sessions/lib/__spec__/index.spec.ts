import { describe, it, expect } from 'vitest'
import {
  isCompatibleRecord,
  isStartingRecord,
  isTapSupportedBrowser,
  recordFileName,
  parseRecordPid,
  sessionProbePath,
  tapGraphqlPath,
  TAP_GRAPHQL_ROUTE_PREFIX,
  buildTapSchema,
  SESSIONS_ROUTE_PREFIX,
  SESSIONS_DIRNAME,
  SCHEMA_VERSION,
  TAP_COMMANDS,
  PIN_TARGET_REMEDY,
  unmetDependency,
} from '../index'
import type { TapCommandOptionSchema } from '../index'

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

  describe('a starting record', () => {
    const starting = { ...validRecord, serverPort: 0, status: 'starting' as const, loadError: { message: 'boom' } }

    it('is accepted with no server port and a load error', () => {
      expect(isCompatibleRecord(starting)).toBe(true)
    })

    it('must say why the project did not load', () => {
      expect(isCompatibleRecord({ ...starting, loadError: undefined })).toBe(false)
    })

    it('is told apart from a session that has a server', () => {
      expect(isStartingRecord(starting)).toBe(true)
      expect(isStartingRecord(validRecord)).toBe(false)
    })

    it('is the only record that may name port 0', () => {
      expect(isCompatibleRecord({ ...validRecord, serverPort: 0 })).toBe(false)
    })

    it('rejects an unknown status or a load error without a message', () => {
      expect(isCompatibleRecord({ ...starting, status: 'ready' })).toBe(false)
      expect(isCompatibleRecord({ ...starting, loadError: {} })).toBe(false)
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

  describe('tap graphql route', () => {
    it('builds the operation path from the shared prefix', () => {
      expect(tapGraphqlPath('TapSpecs')).toBe(`${TAP_GRAPHQL_ROUTE_PREFIX}TapSpecs`)
      expect(tapGraphqlPath('TapSpecs')).toBe('/__cypress/tap/graphql/TapSpecs')
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

    // A `requires` naming no declared option would never be satisfiable, one naming
    // itself would never fire, and an `unless` naming no option would never excuse.
    it('points every option dependency at other options of the same command', () => {
      const dependencies = TAP_COMMANDS.flatMap(({ options }) => {
        const declared: readonly TapCommandOptionSchema[] = options
        const names = declared.map(({ name }) => name)

        return declared.flatMap((option) => option.requires ? [{ option: option.name, requires: option.requires, names }] : [])
      })

      expect(dependencies).not.toHaveLength(0)

      for (const { option, requires, names } of dependencies) {
        expect(requires.option).not.toBe(option)
        expect(names).toContain(requires.option)

        if (requires.unless !== undefined) {
          expect(names).toContain(requires.unless)
        }
      }
    })

    describe('unmetDependency', () => {
      const options = TAP_COMMANDS.find(({ name }) => name === 'pin')!.options as readonly TapCommandOptionSchema[]

      it('names the companion an option was passed without', () => {
        const unmet = unmetDependency(options, { 'test-id': 'r1' })

        expect(unmet?.code).toBe('MISSING_COMPANION_OPTION')
        expect(unmet?.detail).toContain('You passed the `--test-id` flag without also passing the `--command-id` flag.')
        expect(unmet?.detail).toContain(PIN_TARGET_REMEDY)
      })

      it('is satisfied by the companion, or excused by the option that makes it moot', () => {
        expect(unmetDependency(options, { 'test-id': 'r1', 'command-id': '1' })).toBeUndefined()
        expect(unmetDependency(options, { 'test-id': 'r1', clear: true })).toBeUndefined()
        expect(unmetDependency(options, { 'test-id': 'r1', clear: 'true' })).toBeUndefined()
        expect(unmetDependency(options, {})).toBeUndefined()
      })

      it('treats a switch given as false as not given', () => {
        expect(unmetDependency(options, { 'test-id': 'r1', clear: false })?.code).toBe('MISSING_COMPANION_OPTION')
      })
    })

    it('advertises every option a command declares', () => {
      const command = TAP_COMMANDS.find(({ name }) => name === 'command')!
      const advertised = buildTapSchema('15.0.0').commands.find(({ name }) => name === 'command')!

      expect(advertised.options.map(({ name }) => name)).toContain('depth')
      expect(advertised.options.map(({ name }) => name)).toEqual(command.options.map(({ name }) => name))
    })
  })
})
