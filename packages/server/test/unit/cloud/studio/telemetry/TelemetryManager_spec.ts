import { performance } from 'perf_hooks'
import {
  telemetryManager,
  MARK_NAMES,
  MEASURE_NAMES,
  TELEMETRY_GROUP_NAMES,
} from '../../../../../lib/cloud/studio/telemetry/TelemetryManager'
import { expect } from 'chai'

// Helper function to create a controlled delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('TelemetryManager', () => {
  beforeEach(() => {
    // Reset performance marks and measures before each test
    performance.clearMarks()
    performance.clearMeasures()
  })

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = telemetryManager
      const instance2 = telemetryManager

      expect(instance1).to.equal(instance2)
    })
  })

  describe('mark', () => {
    it('should create a performance mark', () => {
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      const marks = performance.getEntriesByType('mark')

      expect(marks).to.have.lengthOf(1)
      expect(marks[0].name).to.equal(MARK_NAMES.INITIALIZATION_START)
    })

    it('should create multiple marks', () => {
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)
      const marks = performance.getEntriesByType('mark')

      expect(marks).to.have.lengthOf(2)
      expect(marks.map((m) => m.name)).to.include(
        MARK_NAMES.INITIALIZATION_START,
      )

      expect(marks.map((m) => m.name)).to.include(
        MARK_NAMES.INITIALIZATION_END,
      )
    })
  })

  describe('getMeasure', () => {
    it('should return -1 when marks are not present', () => {
      const duration = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(duration).to.equal(-1)
    })

    it('should return accurate duration when marks are present', async () => {
      const expectedDelay = 50 // 50ms delay

      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const duration = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )
      const measure = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)

      expect(measure?.duration).to.equal(duration)
    })
  })

  describe('getMeasures', () => {
    it('should return object with -1 measures when no measures are present', () => {
      const measures = telemetryManager.getMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
      ])

      expect(measures).to.deep.equal({
        [MEASURE_NAMES.INITIALIZATION_DURATION]: -1,
      })
    })

    it('should return accurate measures for multiple timers', async () => {
      const expectedDelay1 = 50 // 50ms delay
      const expectedDelay2 = 100 // 100ms delay

      // Set up marks for first timer
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay1)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      // Set up marks for second timer
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
      await delay(expectedDelay2)
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)

      const measures = telemetryManager.getMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      ])

      expect(Object.keys(measures)).to.have.lengthOf(2)

      // Check first timer
      const measure1 = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)

      expect(measure1?.duration).to.equal(
        measures[MEASURE_NAMES.INITIALIZATION_DURATION],
      )

      // Check second timer
      const measure2 = performance
      .getEntriesByType('measure')
      .find((m) => m.name === MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION)

      expect(measure2?.duration).to.equal(
        measures[MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION],
      )
    })

    it('should clear measures when clear option is true', async () => {
      const expectedDelay = 50 // 50ms delay

      // Set up marks
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      // Get measures with clear=true
      const measures = telemetryManager.getMeasures(
        [MEASURE_NAMES.INITIALIZATION_DURATION],
        true,
      )

      expect(measures).to.have.property(MEASURE_NAMES.INITIALIZATION_DURATION).that.is.a('number')

      // Verify measures were cleared
      const remainingMeasures = performance.getEntriesByType('measure')

      expect(remainingMeasures).to.have.lengthOf(0)
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

      expect(telemetryManager['groupMetadata'][TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO]).to.deep.equal({
        test: 'test',
      })
    })
  })

  describe('clearTimerGroup', () => {
    it('should clear specified timer group and its measures', async () => {
      const expectedDelay = 50 // 50ms delay

      // Set up marks and measures for first timer
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure).to.equal(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)?.duration,
      )

      // Clear the timer group
      telemetryManager.clearMeasureGroup(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Verify measures and marks are cleared
      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).to.have.lengthOf(0)
      expect(marks).to.have.lengthOf(0)
    })
  })

  describe('clearMeasures', () => {
    it('should clear specified measures and their marks', async () => {
      const expectedDelay = 50 // 50ms delay

      // Set up marks and measure
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure).to.equal(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.INITIALIZATION_DURATION)?.duration,
      )

      // Clear the measure
      telemetryManager.clearMeasures([MEASURE_NAMES.INITIALIZATION_DURATION])

      // Verify measure and marks are cleared
      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).to.have.lengthOf(0)
      expect(marks).to.have.lengthOf(0)
    })

    it('should clear multiple measures', async () => {
      const expectedDelay1 = 50 // 50ms delay
      const expectedDelay2 = 100 // 100ms delay

      // Set up marks and measures for two timers
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      await delay(expectedDelay1)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure1 = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure1).to.equal(
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

      expect(measure2).to.equal(
        performance
        .getEntriesByType('measure')
        .find((m) => m.name === MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION)?.duration,
      )

      // Clear both measures
      telemetryManager.clearMeasures([
        MEASURE_NAMES.INITIALIZATION_DURATION,
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      ])

      // Verify all measures and marks are cleared
      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).to.have.lengthOf(0)
      expect(marks).to.have.lengthOf(0)
    })
  })

  describe('reset', () => {
    it('should clear all marks and measures', async () => {
      // Set up multiple marks and measures
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_START)
      telemetryManager.mark(MARK_NAMES.INITIALIZATION_END)

      const measure1 = telemetryManager.getMeasure(
        MEASURE_NAMES.INITIALIZATION_DURATION,
      )

      expect(measure1).to.be.greaterThan(0)

      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
      telemetryManager.mark(MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)

      const measure2 = telemetryManager.getMeasure(
        MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION,
      )

      expect(measure2).to.be.greaterThan(0)

      // Reset everything
      telemetryManager.reset()

      // Verify all marks and measures are cleared
      const measures = performance.getEntriesByType('measure')
      const marks = performance.getEntriesByType('mark')

      expect(measures).to.have.lengthOf(0)
      expect(marks).to.have.lengthOf(0)
    })
  })
})
