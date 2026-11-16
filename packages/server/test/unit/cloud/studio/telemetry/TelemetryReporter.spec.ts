import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import {
  MEASURE_NAMES,
  TELEMETRY_GROUP_NAMES,
} from '../../../../../lib/cloud/studio/telemetry/TelemetryManager'

type TelemetryReporterModule = typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter')

const state = vi.hoisted(() => {
  return {
    telemetryManager: undefined as any,
    mockPost: undefined as unknown as Mock,
  }
})

vi.mock('../../../../../lib/cloud/get_cloud_metadata', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/cloud/get_cloud_metadata')>()

  return {
    ...actual,
    getCloudMetadata: vi.fn(async () => {
      return {
        cloudUrl: 'https://cloud.cypress.io',
        cloudHeaders: {
          'x-cypress-version': 'test-version',
        },
      }
    }),
  }
})

vi.mock('../../../../../lib/cloud/api/cloud_request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/cloud/api/cloud_request')>()

  return {
    ...actual,
    CloudRequest: {
      post: (...args: unknown[]) => state.mockPost(...args),
    },
  }
})

vi.mock('../../../../../lib/cloud/studio/telemetry/TelemetryManager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryManager')>()

  return {
    ...actual,
    get telemetryManager () {
      return state.telemetryManager
    },
  }
})

describe('TelemetryReporter', () => {
  let TelemetryReporter: TelemetryReporterModule['TelemetryReporter']
  let initializeTelemetryReporter: TelemetryReporterModule['initializeTelemetryReporter']
  let reportTelemetry: TelemetryReporterModule['reportTelemetry']
  let originalNodeEnv: string | undefined
  let mockPost: Mock
  let telemetryManager: any

  const mockOptions = {
    studioHash: 'test-hash',
    projectSlug: 'test-project',
    cloudApi: {
      CloudRequest: {
        post: mockPost,
      },
      cloudUrl: 'https://cloud.cypress.io',
      cloudHeaders: {
        'x-cypress-version': 'test-version',
      },
    },
  }

  beforeEach(async () => {
    originalNodeEnv = process.env.NODE_ENV
    vi.spyOn(console, 'error').mockImplementation(() => {})

    telemetryManager = {
      getMeasures: vi.fn().mockReturnValue({
        [MEASURE_NAMES.INITIALIZATION_DURATION]: 100,
        [MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION]: 200,
      }),
      clearMeasureGroup: vi.fn().mockResolvedValue(undefined),
    }

    mockPost = vi.fn().mockResolvedValue(undefined)

    state.telemetryManager = telemetryManager
    state.mockPost = mockPost

    // TelemetryReporter holds its singleton in a static field; re-import for a fresh one per test
    vi.resetModules()
    const TelemetryReporterDefinition: TelemetryReporterModule = await import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter')

    TelemetryReporter = TelemetryReporterDefinition.TelemetryReporter
    initializeTelemetryReporter = TelemetryReporterDefinition.initializeTelemetryReporter
    reportTelemetry = TelemetryReporterDefinition.reportTelemetry
  })

  afterEach(() => {
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv as
        | 'development'
        | 'test'
        | 'production'
    } else {
      delete process.env.NODE_ENV
    }

    vi.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('throws error if not initialized', async () => {
      expect(() => {
        TelemetryReporter.getInstance()
      }).toThrow('TelemetryReporter not initialized')
    })

    it('returns the same instance on multiple calls', async () => {
      initializeTelemetryReporter(mockOptions as any)
      const instance1 = TelemetryReporter.getInstance()
      const instance2 = TelemetryReporter.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('reportTelemetry', () => {
    beforeEach(() => {
      initializeTelemetryReporter(mockOptions as any)
    })

    it('sends telemetry to cloud with correct payload', async () => {
      TelemetryReporter.getInstance().reportTelemetry(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Await the post promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 5))

      expect(mockPost.mock.calls).toStrictEqual([[
        'https://cloud.cypress.io/studio/telemetry',
        {
          projectSlug: 'test-project',
          telemetryGroupName: TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
          measures: {
            [MEASURE_NAMES.INITIALIZATION_DURATION]: 100,
            [MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION]: 200,
          },
          metadata: undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': 'test-version',
          },
        },
      ]])
    })

    it('handles cloud request errors gracefully', async () => {
      const cloudError = new Error('Cloud request failed')

      mockPost.mockRejectedValue(cloudError)

      TelemetryReporter.getInstance().reportTelemetry(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Wait for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 5))

      // Verify the error was handled gracefully (no uncaught exceptions)
      expect(mockPost).toHaveBeenCalled()
    })

    it('handles telemetry manager errors gracefully', async () => {
      telemetryManager.getMeasures.mockImplementation(() => {
        throw new Error('Failed to get measures')
      })

      TelemetryReporter.getInstance().reportTelemetry(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Wait for the promise to resolve
      await new Promise(setImmediate)

      // Verify the error was handled gracefully (no uncaught exceptions)
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe('reportTelemetry function', () => {
    beforeEach(() => {
      initializeTelemetryReporter(mockOptions as any)
    })

    it('uses the singleton instance', async () => {
      reportTelemetry(TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        test: 'test',
      })

      await new Promise((resolve) => setTimeout(resolve, 5))

      expect(mockPost).toHaveBeenCalledWith(
        'https://cloud.cypress.io/studio/telemetry',
        {
          projectSlug: 'test-project',
          telemetryGroupName: TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
          measures: {
            [MEASURE_NAMES.INITIALIZATION_DURATION]: 100,
            [MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION]: 200,
          },
          metadata: {
            test: 'test',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-cypress-version': 'test-version',
          },
        },
      )

      expect(telemetryManager.clearMeasureGroup).toHaveBeenCalledWith(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )
    })
  })
})
