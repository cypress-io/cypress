/**
 * Opens a generated project with many specs in `cypress open` and closes it
 * once the open-mode startup spans have been handed to the telemetry exporter,
 * so CI can report launchpad:mounted and specs:list:first:render to Honeycomb.
 *
 * Usage: node scripts/open-mode-telemetry.mts [--iterations 20] [--specs 500]
 *
 * Spans only reach Honeycomb when CYPRESS_RECORD_KEY holds the Cypress
 * project's record key and CYPRESS_CONFIG_ENV points at the production API.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { parseArgs, stripVTControlCharacters } from 'node:util'

const SPANS = ['launchpad:mounted', 'specs:list:first:render']
const SPECS_PER_FOLDER = 50
const ITERATION_TIMEOUT_MS = 3 * 60 * 1000
const EXIT_TIMEOUT_MS = 60 * 1000
// The server forwards each span to Cloud as it arrives, so this leaves the last one time to send
const SEND_GRACE_MS = 5 * 1000

const repoRoot = path.resolve(import.meta.dirname, '..')
const cliBin = path.join(repoRoot, 'cli', 'bin', 'cypress')

const scaffoldProject = async (specCount: number): Promise<string> => {
  const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-open-mode-telemetry-'))

  // ypt4pf is the Cypress project, the only one whose telemetry Cloud forwards to Honeycomb
  await fs.writeFile(path.join(projectRoot, 'cypress.config.ts'), [
    'export default {',
    `  projectId: 'ypt4pf',`,
    '  e2e: { supportFile: false },',
    '}',
    '',
  ].join('\n'))

  for (let i = 0; i < specCount; i++) {
    const folder = path.join(projectRoot, 'cypress', 'e2e', `folder-${Math.floor(i / SPECS_PER_FOLDER)}`)

    await fs.mkdir(folder, { recursive: true })
    await fs.writeFile(path.join(folder, `spec-${i}.cy.ts`), `it('passes ${i}', () => {})\n`)
  }

  return projectRoot
}

// The Cypress group is detached, so an interrupt that reaches only this script is
// passed on to it, and the temporary project is still removed
let interruptedBy: NodeJS.Signals | undefined
let stopActive: (() => void) | undefined

const openOnce = (projectRoot: string, iteration: number): Promise<void> => {
  const child = spawn(process.execPath, [cliBin, 'open', '--dev', '--project', projectRoot, '--e2e', '--browser', 'electron'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CYPRESS_INTERNAL_ENABLE_TELEMETRY: 'true',
      // There is no one to dismiss the major version welcome screen, which would
      // otherwise stop the browser from launching
      CYPRESS_AGENT_MODE: '1',
      DEBUG: 'cypress:server:telemetry,cypress:data-context:graphql:telemetry',
      // The CLI only passes the app's stderr lines through when they look like
      // colored debug output, and it turns colors off when stderr is a pipe
      FORCE_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // The CLI does not forward signals to the app it starts. A terminal's Ctrl-C reaches
    // the app by signalling the whole process group, so the CLI gets a group to signal
    detached: true,
  })

  const signalGroup = (signal: NodeJS.Signals) => {
    if (child.pid === undefined) return

    try {
      process.kill(-child.pid, signal)
    } catch {
      // The group has already exited
    }
  }

  return new Promise((resolve, reject) => {
    const remaining = new Set(SPANS)
    let stopping = false
    let exportError: string | undefined
    // Cleared once the group exits, so a process group ID the OS reuses is never signalled
    const timers: NodeJS.Timeout[] = []

    const stop = () => {
      if (stopping) return

      stopping = true
      // SIGINT runs Cypress's graceful-exit steps, which include shutting down telemetry
      signalGroup('SIGINT')
      timers.push(setTimeout(() => signalGroup('SIGKILL'), EXIT_TIMEOUT_MS))
    }

    const timeout = setTimeout(() => {
      exportError = `timed out waiting for ${[...remaining].join(', ')}`
      stop()
    }, ITERATION_TIMEOUT_MS)

    timers.push(timeout)
    stopActive = stop

    const onLine = (output: string) => {
      const line = stripVTControlCharacters(output)

      if (line.includes('error exporting telemetry data')) {
        exportError = line
      }

      if (!line.includes('exporting spans from')) return

      console.log(`[${iteration}] ${line.trim()}`)

      for (const span of remaining) {
        if (line.includes(span)) {
          remaining.delete(span)
        }
      }

      if (remaining.size === 0) {
        clearTimeout(timeout)
        timers.push(setTimeout(stop, SEND_GRACE_MS))
      }
    }

    readline.createInterface({ input: child.stdout }).on('line', onLine)
    readline.createInterface({ input: child.stderr }).on('line', onLine)

    child.on('error', reject)
    // 'close' waits for stdout and stderr to drain, so lines printed while exiting are still read
    child.on('close', (code, signal) => {
      timers.forEach(clearTimeout)
      stopActive = undefined

      if (interruptedBy) {
        return reject(new Error(`iteration ${iteration}: interrupted by ${interruptedBy}`))
      }

      if (exportError) {
        return reject(new Error(`iteration ${iteration}: ${exportError}`))
      }

      if (remaining.size > 0) {
        return reject(new Error(`iteration ${iteration}: cypress exited (${signal ?? code}) before reporting ${[...remaining].join(', ')}`))
      }

      resolve()
    })
  })
}

const main = async () => {
  const { values } = parseArgs({
    options: {
      iterations: { type: 'string', default: '20' },
      specs: { type: 'string', default: '500' },
    },
  })

  const iterations = Number(values.iterations)
  const specCount = Number(values.specs)

  if (!Number.isInteger(iterations) || iterations < 1 || !Number.isInteger(specCount) || specCount < 1) {
    throw new Error('--iterations and --specs must be positive integers')
  }

  if (!process.env.CYPRESS_RECORD_KEY) {
    throw new Error('CYPRESS_RECORD_KEY must be set: without a record key the telemetry exporter drops every span')
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      interruptedBy = signal
      stopActive?.()
    })
  }

  const projectRoot = await scaffoldProject(specCount)

  console.log(`Opening ${projectRoot} (${specCount} specs) ${iterations} times`)

  try {
    for (let i = 1; i <= iterations && !interruptedBy; i++) {
      await openOnce(projectRoot, i)
    }

    if (interruptedBy) {
      throw new Error(`interrupted by ${interruptedBy}`)
    }
  } finally {
    await fs.rm(projectRoot, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
