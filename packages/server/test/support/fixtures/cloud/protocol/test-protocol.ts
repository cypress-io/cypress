import type { ProtocolManagerShape } from '@packages/types'

declare const Debug: (namespace) => import('debug').IDebugger
declare const performance: {
  now(): number
  timeOrigin: number
}

export class AppCaptureProtocol implements ProtocolManagerShape {
  private Debug: typeof Debug
  private performance: typeof performance

  constructor () {
    this.Debug = Debug
    this.performance = performance
  }

  setupProtocol = (script, runId) => {
    return Promise.resolve()
  }
  connectToBrowser = (cdpClient) => {
    return Promise.resolve()
  }
  addRunnables = (runnables) => {}
  beforeSpec = (spec) => {}
  afterSpec = () => {
    return Promise.resolve()
  }
  beforeTest = (test) => {}
  commandLogAdded = (log) => {}
  commandLogChanged = (log) => {}
  viewportChanged = (input) => {}
  urlChanged = (input) => {}
  pageLoading = (input) => {}
  resetTest = (testId) => {}
  sendErrors (errors) {
    return Promise.resolve()
  }
  uploadCaptureArtifact (uploadUrl) {
    return Promise.resolve()
  }
  afterTest (test): void {}
}
