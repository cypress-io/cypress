import Debug from 'debug'
import {
  TELEMETRY_GROUPS,
  TelemetryGroupName,
  telemetryManager,
} from './TelemetryManager'
import type { CloudDataSource } from '@packages/data-context/src/sources/CloudDataSource'
import { CloudRequest } from '../../api/cloud_request'
import { getCloudMetadata } from '../../get_cloud_metadata'

const debug = Debug('cypress:server:cloud:studio:telemetry:reporter')

interface TelemetryReporterOptions {
  projectSlug?: string
  cloudDataSource: CloudDataSource
}

export class TelemetryReporter {
  private static instance: TelemetryReporter
  private projectSlug?: string
  private cloudDataSource: CloudDataSource

  private constructor ({
    projectSlug,
    cloudDataSource,
  }: TelemetryReporterOptions) {
    this.projectSlug = projectSlug
    this.cloudDataSource = cloudDataSource
  }

  public static initialize (options: TelemetryReporterOptions): void {
    if (TelemetryReporter.instance) {
      // initialize gets called multiple times (e.g. if you switch between projects)
      // we need to reset the telemetry manager to avoid accumulating measures
      telemetryManager.reset()
    }

    TelemetryReporter.instance = new TelemetryReporter(options)
  }

  public static getInstance (): TelemetryReporter {
    if (!TelemetryReporter.instance) {
      throw new Error('TelemetryReporter not initialized')
    }

    return TelemetryReporter.instance
  }

  public reportTelemetry (
    telemetryGroupName: TelemetryGroupName,
    metadata?: Record<string, unknown>,
  ): void {
    this._reportTelemetry(telemetryGroupName, metadata).catch((e: unknown) => {
      debug(
        'Error reporting telemetry to cloud: %o, original telemetry: %s',
        e,
        telemetryGroupName,
      )
    })
  }

  private async _reportTelemetry (
    telemetryGroupName: TelemetryGroupName,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    debug('Reporting telemetry for group: %s', telemetryGroupName)

    try {
      const groupMeasures = [...TELEMETRY_GROUPS[telemetryGroupName]]
      const measures = telemetryManager.getMeasures(groupMeasures)

      const payload = {
        projectSlug: this.projectSlug,
        telemetryGroupName,
        measures,
        metadata,
      }

      const { cloudUrl, cloudHeaders } = await getCloudMetadata(this.cloudDataSource)

      await CloudRequest.post(
        `${cloudUrl}/studio/telemetry`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...cloudHeaders,
          },
        },
      )
    } catch (e: unknown) {
      debug(
        'Error reporting telemetry to cloud: %o, original telemetry: %s',
        e,
        telemetryGroupName,
      )
    }
  }
}

export const initializeTelemetryReporter = (
  options: TelemetryReporterOptions,
) => {
  TelemetryReporter.initialize(options)
}

export const reportTelemetry = (
  telemetryGroupName: TelemetryGroupName,
  metadata?: Record<string, unknown>,
) => {
  TelemetryReporter.getInstance().reportTelemetry(telemetryGroupName, metadata)
  telemetryManager.clearMeasureGroup(telemetryGroupName)
}
