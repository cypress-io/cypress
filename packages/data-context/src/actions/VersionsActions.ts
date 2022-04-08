import type { DataContext } from '..'

export class VersionsActions {
  constructor (private ctx: DataContext) {}

  /**
   * Resets the latest version call so that it will be queried again with additional telemetry about the user
   */
  resetLatestVersionTelemetry () {
    this.ctx.versions.resetLatestVersionTelemetry()
  }
}
