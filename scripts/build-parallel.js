#!/usr/bin/env node
// Parallelizes the Electron binary download/packaging against the bulk TS
// compile. `build-binary` only needs @packages/electron's subtree compiled
// (bin/cypress-electron requires ../dist/index.js, install.ts needs
// @packages/icons + @packages/root), so we build that subtree first, then
// fan out: download/package the binary while the rest of the monorepo
// compiles. This moves the Electron prebuilt download off the critical path.
//
// Concurrency is capped at 4 (per #33483, to avoid CI hangs/OOM on big
// runners) but never exceeds available parallelism — see scripts/lerna-build.js
// for the arm.medium (2 CPU) segfault rationale (#33730).
const { spawn } = require('child_process')
const path = require('path')
const os = require('os')

const lerna = path.resolve(__dirname, '..', 'node_modules', '.bin', 'lerna')
const concurrency = Math.min(4, os.availableParallelism())

function run (cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true })

    child.on('exit', (code, signal) => {
      if (signal) {
        return reject(new Error(`'${cmd}' was killed by signal ${signal}`))
      }

      return code === 0
        ? resolve()
        : reject(new Error(`'${cmd}' exited with code ${code}`))
    })
  })
}

const buildArgs = (extra = []) => [
  'run', 'build', '--stream', `--concurrency=${concurrency}`, ...extra,
]

async function main () {
  // 1. Compile the electron subtree first so build-binary's require('../dist/index.js')
  //    can't race. Dependencies (icons, root, stderr-filtering, ...) are pulled in
  //    automatically via build's `dependsOn: ["^build"]` in nx.json.
  await run(lerna, buildArgs(['--scope', '@packages/electron', '--include-dependencies']))

  // 2. Fan out: download/package the Electron binary while the rest of the
  //    monorepo compiles. The small electron subtree is recompiled here (build
  //    is uncached), which is cheap relative to overlapping the network-bound
  //    download with the CPU-bound full compile.
  await Promise.all([
    run('yarn', ['workspace', '@packages/electron', 'build-binary']),
    run(lerna, buildArgs()),
  ])
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
