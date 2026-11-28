import { spawnSync } from 'node:child_process'

if (process.argv.length > 2) {
  console.error('test-scripts runs every scripts spec. To pass a spec path or flags, call `yarn test-scripts:vitest` or `yarn test-scripts:mocha` instead.')
  process.exit(1)
}

// Runs each runner even after one fails, so a Vitest failure can't hide mocha's.
// `shell` lets Windows resolve `yarn` to `yarn.cmd`.
const runners = ['test-scripts:vitest', 'test-scripts:mocha']

const failed = runners.filter((script) => spawnSync('yarn', [script], { stdio: 'inherit', shell: true }).status !== 0)

process.exit(failed.length ? 1 : 0)
