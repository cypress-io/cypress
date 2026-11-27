import { sanitizeEnv } from './env-allowlist'

// Runs in vitest's main process before the workers start, so every worker
// inherits the sanitized environment plus the config's own `test.env`. A CI
// secret or a developer's CYPRESS_* or DEBUG setting can then neither leak into
// a failing assertion's diff nor change what the code under test does.
export default function setup (): void {
  sanitizeEnv(process.env)
}
