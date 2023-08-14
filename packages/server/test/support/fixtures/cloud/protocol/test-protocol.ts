import type { Database } from 'better-sqlite3'
import type { AppCaptureProtocolInterface, CDPClient } from '@packages/types'

export class AppCaptureProtocol implements AppCaptureProtocolInterface {
  beforeSpec (db: Database): void {}
  addRunnables (runnables: any): void {}
  commandLogAdded (log: any): void {}
  commandLogChanged (log: any): void {}
  viewportChanged (input: any): void {}
  urlChanged (input: any): void {}
  beforeTest (test: Record<string, any>): Promise<void> {
    return Promise.resolve()
  }
  preAfterTest (test: Record<string, any>, options: Record<string, any>): Promise<void> {
    return Promise.resolve()
  }
  afterTest (test: Record<string, any>): Promise<void> {
    return Promise.resolve()
  }
  afterSpec (): Promise<void> {
    return Promise.resolve()
  }
  connectToBrowser (cdpClient: CDPClient): Promise<void> {
    return Promise.resolve()
  }
  pageLoading (input: any): void {}
  resetTest (testId: string): void {}
}
