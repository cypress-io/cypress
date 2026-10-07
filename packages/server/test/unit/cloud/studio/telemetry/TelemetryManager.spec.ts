import { performance } from 'perf_hooks'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  telemetryManager,
  MARK_NAMES,
  MEASURE_NAMES,
  TELEMETRY_GROUP_NAMES,
} from '../../../../../lib/cloud/studio/telemetry/TelemetryManager'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('TelemetryManager', () => {
  beforeEach(() => {
    performance.clearMarks()
    performance.clearMeasures()
  })

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = telemetryManager
      const instance2 = telemetryManager

      expect(instance1).toBe(instance2)
    })
  })

  describe('mark', () => {
    it('should create a performance mark', () => {
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      const marks = performance.getEntriesByType('mark')

      expect(marks).toHaveLength(1)
      expect(marks[0].name).toBe(MARK_NAMES.INITIALIZATION_START)
    })

    it('should create multiple marks', () => {
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)
      const marks = performance.getEntriesByType('mark')

      expect(marks).toHaveLength(2)
      expect(marks.map((m) => m.name)).toContain(
        MARK_NAMES.INITIALIZATION_START,
      )

      expect(marks.map((m) => m.name)).toContain(
        MARK_NAMES.INITIALIZATION_END,
      )
    })
  })

  describe('getMeasure', () => {
    it('should return -1 when marks are not present', () => {
      const duration = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(duration).toBe(-1)
    })

    it('should return accurate duration when marks are present', async () => {
      const expectedDelay = 50

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const duration = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )
      const measure = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)

      expect(measure?.duration).toBe(duration)
    })
  })

  describe('getMeasures', () => {
    it('should return object with -1 measures when no measures are present', () => {
      const measures = telemetryManager.getMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
      ])

      expect(measures).toEqual({
        [MEASURE_NAMES.INITIALIZATION_DURATION]: -1,
      })
    })

    it('should return accurate measures for multiple timers', async () => {
      const expectedDelay1 = 50
      const expectedDelay2 = 100

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay1)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
      await delay(expectedDelay2)
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)

      const measures = telemetryManager.getMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      ])

      expect(Object.keys(measures)).toHaveLength(2)

      const measure1 = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)

      expect(measure1?.duration).toBe(
        measures[MEASURE_NAMES.INITIALIZATION_DURATION],
      )

      const measure2 = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION)

      expect(measure2?.duration).toBe(
        measures[MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION],
      )
    })

    it('should clear measures when clear option is true', async () => {
      const expectedDelay = 50

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measures = telemetryManager.getMeasures(
        [MEASURE_NAMES.INITIALIZATION_DURATION],
        true,
      )

      expect(measures[MEASURE_NAMES.INITIALIZATION_DURATION]).toEqual(expect.any(Number))

      const remainingMeasures = performance.getEntriesByType('measure')

      expect(remainingMeasures).toHaveLength(0)
    })
  })

  describe('addGroupMetadata', () => {
    it('should add metadata to a group', () => {
      telemetryManager.addGroupMetadata(TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        test: 'test',
      })

      telemetryManager.addGroupMetadata(TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        test: 'test',
      })

      expect(telemetryManager['groupMetadata'][TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO]).toEqual({
        test: 'test',
      })
    })
  })

  describe('clearTimerGroup', () => {
    it('should clear specified timer group and its measures', async () => {
      const expectedDelay = 50

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure).toBe(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)?.duration,
      )

      telemetryManager.clearMeasureGroup(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).toHaveLength(0)
      expect(marks).toHaveLength(0)
    })
  })

  describe('clearMeasures', () => {
    it('should clear specified measures and their marks', async () => {
      const expectedDelay = 50

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure).toBe(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)?.duration,
      )

      telemetryManager.clearMeasures([MEASURE_NAMES.INITIALIZATION_DURATION])

      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).toHaveLength(0)
      expect(marks).toHaveLength(0)
    })

    it('should clear multiple measures', async () => {
      const expectedDelay1 = 50
      const expectedDelay2 = 100

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay1)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure1 = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure1).toBe(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)?.duration,
      )

      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
      await delay(expectedDelay2)
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)

      const measure2 = telemetryManager.getMeasure(
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      )

      expect(measure2).toBe(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION)?.duration,
      )

      telemetryManager.clearMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      ])

      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).toHaveLength(0)
      expect(marks).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('should clear all marks and measures', async () => {
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure1 = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure1).toBeGreaterThan(0)

      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)

      const measure2 = telemetryManager.getMeasure(
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      )

      expect(measure2).toBeGreaterThan(0)

      telemetryManager.reset()

      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).toHaveLength(0)
      expect(marks).toHaveLength(0)
    })
  })
})
