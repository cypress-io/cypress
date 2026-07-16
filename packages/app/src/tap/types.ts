import type { SerializedTest } from '@packages/types'

export interface TapTestsRunner {
  getTestsState (testId?: string): Record<string, SerializedTest>
  isRunComplete (): boolean
}
