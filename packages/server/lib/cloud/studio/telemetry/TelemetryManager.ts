import { performance } from 'perf_hooks'
import { BUNDLE_LIFECYCLE_MARK_NAMES, BUNDLE_LIFECYCLE_MEASURE_NAMES, BUNDLE_LIFECYCLE_MEASURES, BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES, BUNDLE_LIFECYCLE_TELEMETRY_GROUPS } from './constants/bundle-lifecycle'
import { INITIALIZATION_MARK_NAMES, INITIALIZATION_MEASURE_NAMES, INITIALIZATION_MEASURES, INITIALIZATION_TELEMETRY_GROUP_NAMES, INITIALIZATION_TELEMETRY_GROUPS } from './constants/initialization'

export const MARK_NAMES = Object.freeze({
  ...BUNDLE_LIFECYCLE_MARK_NAMES,
  ...INITIALIZATION_MARK_NAMES,
} as const)

type MarkName = (typeof MARK_NAMES)[keyof typeof MARK_NAMES]

export const MEASURE_NAMES = Object.freeze({
  ...BUNDLE_LIFECYCLE_MEASURE_NAMES,
  ...INITIALIZATION_MEASURE_NAMES,
} as const)

type MeasureName = (typeof MEASURE_NAMES)[keyof typeof MEASURE_NAMES]

const MEASURES: Record<MeasureName, [MarkName, MarkName]> = Object.freeze({
  ...BUNDLE_LIFECYCLE_MEASURES,
  ...INITIALIZATION_MEASURES,
} as const)

export const TELEMETRY_GROUP_NAMES = Object.freeze({
  ...BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES,
  ...INITIALIZATION_TELEMETRY_GROUP_NAMES,
} as const)

export const TELEMETRY_GROUPS = Object.freeze({
  ...BUNDLE_LIFECYCLE_TELEMETRY_GROUPS,
  ...INITIALIZATION_TELEMETRY_GROUPS,
} as const)

export type TelemetryGroupName = keyof typeof TELEMETRY_GROUPS

class TelemetryManager {
  private static instance: TelemetryManager
  private groupMetadata: Partial<Record<TelemetryGroupName, Record<string, unknown>>> = {}

  private constructor () {}

  public static getInstance (): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager()
    }

    return TelemetryManager.instance
  }

  public mark (name: MarkName) {
    performance.mark(name)
  }

  public getMeasure (measureName: MeasureName): number {
    const [startMark, endMark] = MEASURES[measureName]

    try {
      const measure = performance.measure(measureName, startMark, endMark)

      return measure?.duration ?? -1
    } catch (error) {
      return -1
    }
  }

  public getMeasures (
    names: MeasureName[],
    clear: boolean = false,
  ): Partial<Record<MeasureName, number>> {
    const result: Partial<Record<MeasureName, number>> = {}

    for (const name of names) {
      result[name] = this.getMeasure(name)
    }
    if (clear) {
      this.clearMeasures(names)
    }

    return result
  }

  public clearMeasureGroup (groupName: TelemetryGroupName) {
    const measures = TELEMETRY_GROUPS[groupName]

    this.clearMeasures(measures)
  }

  public clearMeasures (names: MeasureName[]) {
    for (const name of names) {
      performance.clearMeasures(name)
      performance.clearMarks(MEASURES[name][0])
      performance.clearMarks(MEASURES[name][1])
    }
  }

  public addGroupMetadata (groupName: TelemetryGroupName, metadata: Record<string, unknown>) {
    this.groupMetadata[groupName] = this.groupMetadata[groupName] || {}
    this.groupMetadata[groupName] = {
      ...this.groupMetadata[groupName],
      ...metadata,
    }
  }

  public reset () {
    performance.clearMarks()
    performance.clearMeasures()
    this.groupMetadata = {}
  }
}

export const telemetryManager = TelemetryManager.getInstance()
