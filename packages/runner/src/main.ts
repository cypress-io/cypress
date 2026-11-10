import { UnifiedRunner } from '../unified-runner'

declare global {
  interface Window {
    UnifiedRunner: typeof UnifiedRunner
  }
}

window.UnifiedRunner = UnifiedRunner
