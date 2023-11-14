interface ReporterTestAttempt {
  state: 'skipped' | 'failed' | 'passed'
  error: any
  timings: any
  failedFromHookId: any
  wallClockStartedAt: Date
  wallClockDuration: number
  videoTimestamp: any
}
interface ReporterTest {
  testId: string
  title: string[]
  state: 'skipped' | 'passed' | 'failed'
  body: string
  displayError: any
  attempts: ReporterTestAttempt[]
}

export interface BaseReporterResults {
  error?: string
  stats: {
    failures: number
    tests: number
    passes: number
    pending: number
    suites: number
    skipped: number
    wallClockDuration: number
    wallClockStartedAt: string
    wallClockEndedAt: string
  }
}

export interface ReporterResults extends BaseReporterResults {
  reporter: string
  reporterStats: {
    suites: number
    tests: number
    passes: number
    pending: number
    failures: number
    start: string
    end: string
    duration: number
  }
  hooks: any[]
  tests: ReporterTest[]
}
