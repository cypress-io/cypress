import { spawnSync } from 'node:child_process'

if (process.argv.length > 2) {
  process.stderr.write('test-integration runs every integration spec. To run part of it, call `yarn test-integration-vitest -- <file-name-fragment>` or `yarn test-integration-mocha -- <file-name-fragment>` instead.\n')
  process.exit(1)
}

// Runs each runner even after one fails, so a vitest failure can't hide mocha's.
// `shell` lets Windows resolve `yarn` to `yarn.cmd`.
const runners = ['test-integration-vitest', 'test-integration-mocha']

const failed = runners.filter((script) => spawnSync(`yarn ${script}`, { stdio: 'inherit', shell: true }).status !== 0)

process.exitCode = failed.length ? 1 : 0
