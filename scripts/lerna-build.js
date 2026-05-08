#!/usr/bin/env node
// Cap lerna build concurrency at 4 (per #33483, to avoid CI hangs/OOM on big
// runners) but never exceed available parallelism. Without the lower bound,
// arm.medium (2 CPU) runs 4 simultaneous tsc startups and intermittently
// segfaults inside V8's bytecode-cache deserializer (#33730).
const { spawn } = require('child_process')
const os = require('os')

const concurrency = Math.min(4, os.availableParallelism())

const child = spawn(
  'lerna',
  ['run', 'build', '--stream', `--concurrency=${concurrency}`],
  { stdio: 'inherit', shell: true },
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 1)
  }
})
