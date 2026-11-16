// Runs a project with and without the experimental driver, writing one
// .jsonl (per-command timings), one .json (run results) and, for experimental runs,
// one .agent.jsonl (server-side phases of each agent call) per run.
//
// node scripts/experimental-driver-perf/run.mts --project <project> --out <dir> [--iterations 5] [--first 1] [--browsers chrome,firefox,webkit] [--modes legacy,experimental] [--baseUrl http://localhost:8080] [--pause 0] [--start <command> --ready <url>] [--timeout 30] [--record <key> --projectId <id>]
import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    project: { type: 'string' },
    out: { type: 'string' },
    iterations: { type: 'string', default: '5' },
    // The iteration to start from, to resume an interrupted set of runs in the same --out
    first: { type: 'string', default: '1' },
    browsers: { type: 'string', default: 'chrome,firefox,webkit' },
    modes: { type: 'string', default: 'legacy,experimental' },
    baseUrl: { type: 'string', default: 'http://localhost:8080' },
    // Seconds between runs, for when the specs call a backend that rate-limits
    pause: { type: 'string', default: '0' },
    // A server to start fresh in the project directory before each run and stop after
    // it, such as an API whose state builds up across runs
    start: { type: 'string' },
    // Polled until it responds, before each run starts
    ready: { type: 'string' },
    // Minutes before a run is killed, so a hang can't stall the rest of the runs
    timeout: { type: 'string', default: '30' },
    // Records each run to Cypress Cloud with this key, for measuring with Test Replay on
    record: { type: 'string' },
    // The Cloud project to record to, in place of the project's own projectId
    projectId: { type: 'string' },
  },
})

if (!values.project || !values.out) {
  throw new Error('--project and --out are required')
}

if (!!values.start !== !!values.ready) {
  throw new Error('--start and --ready go together')
}

const project = path.resolve(values.project)
const out = path.resolve(values.out)
const browsers = values.browsers.split(',')
const modes = values.modes.split(',')
const iterations = Number(values.iterations)
const pauseMs = Number(values.pause) * 1000
const repoRoot = path.resolve(import.meta.dirname, '../..')
const cypressBin = path.join(repoRoot, 'node_modules/.bin/cypress')

const env = { ...process.env }

// Some agent hosts set this, and it makes Electron start as plain Node
delete env.ELECTRON_RUN_AS_NODE

fs.mkdirSync(out, { recursive: true })

// Uses node:http rather than fetch, because undici can throw socket errors such as
// `setTypeOfService EINVAL` outside the request's promise, which crashes the script
const isResponding = (url: string) => {
  return new Promise<boolean>((resolve) => {
    const request = http.get(url, { timeout: 1000 }, (response) => {
      response.resume()
      resolve(true)
    })

    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve(false))
  })
}

const waitFor = async (condition: () => Promise<boolean>, what: string, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs

  while (!await condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${what}`)
    }

    await sleep(250)
  }
}

const startServer = async (logFile: string) => {
  if (!values.start || !values.ready) {
    return undefined
  }

  const ready = values.ready

  if (await isResponding(ready)) {
    throw new Error(`${ready} is already responding. Stop that server so each run can start its own.`)
  }

  const log = fs.openSync(logFile, 'w')
  // detached puts the shell and everything it starts in one process group, so they stop together
  const server = spawn(values.start, { cwd: project, shell: true, detached: true, stdio: ['ignore', log, log], env })

  fs.closeSync(log)
  await waitFor(() => isResponding(ready), `${ready} to respond`)

  return server
}

const runCypress = (args: string[], runEnv: NodeJS.ProcessEnv, timeoutMs: number) => {
  return new Promise<{ status: number | null, output: string, timedOut: boolean }>((resolve) => {
    // detached gives Cypress, Electron and the browser one process group. A hung run
    // ignores SIGTERM on the CLI alone, so a timeout has to kill the whole group.
    const child = spawn(cypressBin, args, { cwd: repoRoot, env: runEnv, detached: true })
    const chunks: Buffer[] = []
    let timedOut = false

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => chunks.push(chunk))

    const killGroup = (signal: NodeJS.Signals) => {
      try {
        process.kill(-child.pid!, signal)
      } catch {
        // The group has already exited
      }
    }

    const timer = setTimeout(() => {
      timedOut = true
      killGroup('SIGTERM')
      setTimeout(() => killGroup('SIGKILL'), 10_000).unref()
    }, timeoutMs)

    child.on('close', (status) => {
      clearTimeout(timer)
      resolve({ status, output: Buffer.concat(chunks).toString('utf8'), timedOut })
    })
  })
}

const stopServer = async (server: ChildProcess | undefined) => {
  if (!server?.pid || !values.ready) {
    return
  }

  const ready = values.ready

  process.kill(-server.pid, 'SIGTERM')
  await waitFor(async () => !await isResponding(ready), `${ready} to stop responding`)
}

let isFirstRun = true

// Modes and browsers alternate inside each iteration so drift on the machine
// lands on both sides of the comparison instead of on one
for (let i = Number(values.first); i <= iterations; i++) {
  for (const browser of browsers) {
    for (const mode of modes) {
      const name = `${mode}-${browser}-${i}`
      const commandsFile = path.join(out, `${name}.jsonl`)

      if (!isFirstRun) {
        await sleep(pauseMs)
      }

      isFirstRun = false

      const agentFile = path.join(out, `${name}.agent.jsonl`)

      fs.rmSync(commandsFile, { force: true })
      fs.rmSync(agentFile, { force: true })

      const server = await startServer(path.join(out, `${name}.server.log`))
      const started = Date.now()
      const config = [
        `baseUrl=${values.baseUrl}`,
        'video=false',
        'retries=0',
        ...(values.projectId ? [`projectId=${values.projectId}`] : []),
      ]
      const result = await runCypress([
        'run',
        '--dev',
        '--project', project,
        '--browser', browser,
        '--config', config.join(','),
        '--expose', `perfOut=${commandsFile},perfResults=${path.join(out, `${name}.json`)}`,
        ...(values.record ? ['--record', '--key', values.record, '--tag', name] : []),
      ], { ...env, CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER: String(mode === 'experimental'), CYPRESS_REMOTE_AGENT_PERF: agentFile }, Number(values.timeout) * 60_000)

      const elapsed = Date.now() - started

      await stopServer(server)

      const log = result.output

      fs.writeFileSync(path.join(out, `${name}.log`), log)

      const rateLimited = log.includes('429: Too Many Requests') ? ' (rate limited: 429s in log)' : ''
      const timedOut = result.timedOut ? ` (timed out after ${values.timeout} minutes)` : ''

      process.stdout.write(`${name}: exit ${result.status} in ${(elapsed / 1000).toFixed(0)}s${rateLimited}${timedOut}\n`)
    }
  }
}
