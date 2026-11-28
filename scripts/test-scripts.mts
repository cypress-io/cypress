import { spawnSync } from 'node:child_process'

// Runs each runner even after one fails, so a Vitest failure can't hide mocha's.
// `shell` lets Windows resolve `yarn` to `yarn.cmd`.
const runners = ['test-scripts:vitest', 'test-scripts:mocha']

const failed = runners.filter((script) => spawnSync('yarn', [script], { stdio: 'inherit', shell: true }).status !== 0)

process.exit(failed.length ? 1 : 0)
