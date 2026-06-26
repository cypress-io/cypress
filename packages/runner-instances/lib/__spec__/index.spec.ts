import { describe, it, expect } from 'vitest'
import {
  isCompatibleRecord,
  recordFileName,
  parseRecordPid,
  runnerInstancesProbePath,
  RUNNER_INSTANCES_ROUTE_PREFIX,
  INSTANCES_DIRNAME,
  SCHEMA_VERSION,
} from '../index'

const validRecord = {
  schemaVersion: SCHEMA_VERSION,
  pid: 1234,
  projectRoot: '/projects/app',
  serverPort: 5000,
  instanceId: 'a1b2c3d4-0000-4000-8000-000000000000',
  testingType: 'e2e',
}

describe('runner-instances contract', () => {
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
      expect(isCompatibleRecord({ ...validRecord, instanceId: '' })).toBe(false)
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
      expect(runnerInstancesProbePath('abc')).toBe(`${RUNNER_INSTANCES_ROUTE_PREFIX}abc`)
      expect(runnerInstancesProbePath('abc')).toBe('/__cypress/runner-instances/abc')
    })
  })

  it('exposes the instances dir name', () => {
    expect(INSTANCES_DIRNAME).toBe('instances')
  })
})
