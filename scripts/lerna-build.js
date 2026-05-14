#!/usr/bin/env node
// Cap lerna build concurrency at 4 (per #33483, to avoid CI hangs/OOM on big
// runners) but never exceed available parallelism. Without the lower bound,
// arm.medium (2 CPU) runs 4 simultaneous tsc startups and intermittently
// segfaults inside V8's bytecode-cache deserializer (#33730).
const { spawn } = require('child_process')
const os = require('os')

const concurrency = Math.min(4, os.availableParallelism())

const args = ['run', 'build', '--stream', `--concurrency=${concurrency}`]

const scopeIdx = process.argv.indexOf('--scope')

if (scopeIdx !== -1 && process.argv[scopeIdx + 1]) {
  args.push('--scope', process.argv[scopeIdx + 1])
} else if (process.argv.find((a) => a.startsWith('--scope='))) {
  args.push(process.argv.find((a) => a.startsWith('--scope=')))
}

const child = spawn(
  'lerna',
  args,
  { stdio: 'inherit', shell: true },
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 1)
  }
})
