import {
  MEASURE_NAMES,
  TELEMETRY_GROUP_NAMES,
} from '../../../../../lib/cloud/studio/telemetry/TelemetryManager'
import { expect } from 'chai'
import { proxyquire, sinon } from '../../../../spec_helper'

proxyquire.noPreserveCache()

describe('TelemetryReporter', () => {
  let TelemetryReporter: typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter').TelemetryReporter
  let initializeTelemetryReporter: typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter').initializeTelemetryReporter
  let reportTelemetry: typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter').reportTelemetry
  let consoleErrorStub: sinon.SinonStub
  let originalNodeEnv: string | undefined
  let mockPost: sinon.SinonStub
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

  beforeEach(() => {
    sinon.reset()
    originalNodeEnv = process.env.NODE_ENV
    consoleErrorStub = sinon.stub(console, 'error').callsFake(() => {})

    telemetryManager = {
      getMeasures: sinon.stub().returns({
        [MEASURE_NAMES.INITIALIZATION_DURATION]: 100,
        [MEASURE_NAMES.CAN_ACCESS_STUDIO_AI_DURATION]: 200,
      }),
      clearMeasureGroup: sinon.stub().resolves(),
    }

    mockPost = sinon.stub().resolves()
    const TelemetryReporterDefinition = proxyquire('../lib/cloud/studio/telemetry/TelemetryReporter', {
      '../../get_cloud_metadata': {
        getCloudMetadata: sinon.stub().resolves({
          cloudUrl: 'https://cloud.cypress.io',
          cloudHeaders: {
            'x-cypress-version': 'test-version',
          },
        }),
      },
      '../../api/cloud_request': {
        CloudRequest: {
          post: mockPost,
        },
      },
      './TelemetryManager': {
        telemetryManager,
      },
    }) as typeof import('../../../../../lib/cloud/studio/telemetry/TelemetryReporter')

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

    consoleErrorStub.restore()
  })

  describe('getInstance', () => {
    it('throws error if not initialized', async () => {
      expect(() => {
        TelemetryReporter.getInstance()
      }).to.throw('TelemetryReporter not initialized')
    })

    it('returns the same instance on multiple calls', async () => {
      initializeTelemetryReporter(mockOptions as any)
      const instance1 = TelemetryReporter.getInstance()
      const instance2 = TelemetryReporter.getInstance()

      expect(instance1).to.equal(instance2)
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

      expect(mockPost).to.have.been.calledWith(
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
      )
    })

    it('handles cloud request errors gracefully', async () => {
      const cloudError = new Error('Cloud request failed')

      mockPost.rejects(cloudError)

      TelemetryReporter.getInstance().reportTelemetry(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Wait for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 5))

      // Verify the error was handled gracefully (no uncaught exceptions)
      expect(mockPost).to.have.been.called
    })

    it('handles telemetry manager errors gracefully', async () => {
      telemetryManager.getMeasures.throws(new Error('Failed to get measures'))

      TelemetryReporter.getInstance().reportTelemetry(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )

      // Wait for the promise to resolve
      await new Promise(setImmediate)

      // Verify the error was handled gracefully (no uncaught exceptions)
      expect(mockPost).to.not.have.been.called
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

      expect(mockPost).to.have.been.calledWith(
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

      expect(telemetryManager.clearMeasureGroup).to.have.been.calledWith(
        TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO,
      )
    })
  })
})
