import type { ProtocolManagerShape } from '@packages/types'

/*
declare const Debug: (namespace) => import('debug').IDebugger
declare const performance: {
  now(): number
  timeOrigin: number
}
declare const createHash: {
  (text: string): string
}
*/
export class AppCaptureProtocol implements ProtocolManagerShape {
  // these properties were causing protocol manager to throw when loading the stub
  /*
  constructor () {
    this.Debug = Debug
    this.performance = performance
    this.createHash = createHash
  }
  */

  constructor () {
    throw new Error()
  }

  protocolEnabled: boolean

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
  beforeTest = (test) => {
    return Promise.resolve()
  }
  commandLogAdded = (log) => {}
  commandLogChanged = (log) => {}
  viewportChanged = (input) => {}
  urlChanged = (input) => {}
  pageLoading = (input) => {}
  resetTest (testId) {}
  sendErrors (errors) {
    return Promise.resolve()
  }
  uploadCaptureArtifact ({ uploadUrl }) {
    return Promise.resolve()
  }
  afterTest = (test) => {
    return Promise.resolve()
  }
}
