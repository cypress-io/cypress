import type { DataContext } from '..'

export class CurrentRecordingActions {
  constructor (private ctx: DataContext) {}

  startRun (runId: string) {
    this.ctx.update((d) => {
      d.currentRecordingInfo.runId = runId
    })
  }

  startInstance (instanceId: string) {
    this.ctx.update((d) => {
      d.currentRecordingInfo.instanceId = instanceId
    })
  }
}
