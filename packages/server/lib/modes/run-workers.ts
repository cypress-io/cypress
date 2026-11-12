import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import Debug from 'debug'
import chalk from 'chalk'
import si from 'systeminformation'
import * as errors from '../errors'
import type { SpecWithRelativeRoot } from '@packages/types'
import { defaultStats } from '../util/graceful_crash_handling'
import type { RunResult } from './results'
import { WORKER_INDEX_ENV } from '../util/worker_index'
import * as appData from '../util/app_data'

const debug = Debug('cypress:server:workers')

// Workers write this on stdout after each spec so the coordinator can print
// each spec's output as one block instead of interleaving workers line by line.
export const SPEC_END_DELIMITER = '\u0000cypress:worker:spec-end\u0000\n'

export interface Claim {
  spec: string | null
  claimedInstances: number
  totalInstances: number
  estimated: number | null
  instanceId: string | null
}

type WorkerMessage =
  | { type: 'claim' }
  | { type: 'started', spec: string }
  | { type: 'specResult', results: RunResult }

type CoordinatorMessage = { type: 'claimed', claim: Claim }

// Typical peak RSS of one worker's process tree: Electron main, plugins child and browser
export const PER_WORKER_MEMORY_MB = 1600

const readNumber = async (file: string) => {
  try {
    const value = (await fs.readFile(file, 'utf8')).trim()

    return /^\d+$/.test(value) ? Number(value) : undefined
  } catch {
    return undefined
  }
}

const systemAvailableBytes = async () => (await si.mem()).available

// os.freemem() counts reclaimable cache as used on macOS, and inside a container
// the system figures describe the host rather than the container's limit
export async function availableMemoryMb (cgroupRoot = '/sys/fs/cgroup', getSystemAvailable = systemAvailableBytes): Promise<number> {
  const limits: [string, string][] = [
    [path.join(cgroupRoot, 'memory.max'), path.join(cgroupRoot, 'memory.current')],
    [path.join(cgroupRoot, 'memory', 'memory.limit_in_bytes'), path.join(cgroupRoot, 'memory', 'memory.usage_in_bytes')],
  ]

  const available = await getSystemAvailable()

  for (const [limitFile, usageFile] of limits) {
    const limit = await readNumber(limitFile)
    const usage = await readNumber(usageFile)

    // an unlimited cgroup v1 reports a huge sentinel rather than "max"
    if (limit !== undefined && usage !== undefined && limit < os.totalmem()) {
      return Math.floor(Math.min(limit - usage, available) / 1024 / 1024)
    }
  }

  return Math.floor(available / 1024 / 1024)
}

export async function resolveWorkerCount (requested: unknown, specCount: number, {
  cpus = os.cpus().length,
  availableMb,
  perWorkerMb = PER_WORKER_MEMORY_MB,
}: { cpus?: number, availableMb?: number, perWorkerMb?: number } = {}): Promise<number> {
  const isAuto = requested === 'auto'

  if (!isAuto && !(Number.isInteger(requested) && (requested as number) >= 1)) {
    errors.throwErr('INVALID_WORKERS', requested)
  }

  if (!isAuto && requested === 1) return 1

  const memoryMb = availableMb ?? await availableMemoryMb()
  const fitsInMemory = Math.max(1, Math.floor(memoryMb / perWorkerMb))

  if (isAuto) {
    return Math.max(1, Math.min(cpus - 1, fitsInMemory, specCount))
  }

  if ((requested as number) > fitsInMemory) {
    errors.warning('WORKERS_EXCEED_MEMORY', requested as number, fitsInMemory, memoryMb)
  }

  return requested as number
}

export type SpecDurations = Record<string, number>

export const specDurationsPath = (projectRoot: string) => appData.projectsPath(appData.toHashName(projectRoot), 'spec-durations.json')

export async function readSpecDurations (file: string): Promise<SpecDurations> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return {}
  }
}

export async function writeSpecDurations (file: string, previous: SpecDurations, runs: RunResult[]) {
  const durations = { ...previous }

  for (const run of runs) {
    // a spec that never ran its tests has no useful duration
    if (run.tests?.length && run.stats.wallClockDuration) {
      durations[run.spec.relative] = run.stats.wallClockDuration
    }
  }

  try {
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(durations))
  } catch (err) {
    debug('could not save spec durations: %o', err)
  }
}

/** Longest specs first so a slow spec doesn't start last; specs with no recorded duration go first. */
export const orderByDuration = (specs: SpecWithRelativeRoot[], durations: SpecDurations) => {
  const duration = (spec: SpecWithRelativeRoot) => durations[spec.relative] ?? Infinity

  return [...specs].sort((a, b) => duration(b) - duration(a))
}

export class SpecQueue {
  private pending: string[]
  private claimedCount = 0
  private inFlight = new Map<number, string>()
  private results = new Map<string, RunResult>()

  constructor (private specs: SpecWithRelativeRoot[], durations: SpecDurations = {}) {
    this.pending = orderByDuration(specs, durations).map((spec) => spec.relative)
  }

  claim (workerIndex: number): Claim {
    const spec = this.pending.shift() ?? null

    if (spec) {
      this.claimedCount++
      this.inFlight.set(workerIndex, spec)
    }

    return {
      spec,
      claimedInstances: this.claimedCount,
      totalInstances: this.specs.length,
      estimated: null,
      instanceId: String(workerIndex),
    }
  }

  /** Records a spec that a worker got from somewhere other than this queue, such as Cypress Cloud. */
  start (workerIndex: number, relative: string) {
    this.inFlight.set(workerIndex, relative)
  }

  complete (workerIndex: number, results: RunResult) {
    this.inFlight.delete(workerIndex)
    this.results.set(results.spec.relative, results)
  }

  abandon (workerIndex: number, error: Error): string | undefined {
    const relative = this.inFlight.get(workerIndex)

    if (!relative) {
      return undefined
    }

    this.inFlight.delete(workerIndex)

    const spec = this.specs.find((s) => s.relative === relative)

    if (spec) {
      this.results.set(relative, crashedSpecResult(spec, error))
    }

    return relative
  }

  runsInSpecOrder (): RunResult[] {
    return this.specs.flatMap((spec) => this.results.get(spec.relative) ?? [])
  }
}

export const crashedSpecResult = (spec: SpecWithRelativeRoot, error: Error): RunResult => {
  const { error: message, stats } = defaultStats(error)

  return {
    error: message,
    hooks: [],
    reporter: '',
    reporterStats: {},
    screenshots: [],
    skippedSpec: false,
    spec,
    stats: { ...stats, duration: 0 },
    tests: [],
    video: null,
  } as RunResult
}

const flagsWithValue = new Set(['--workers', '--port', '-p', '--worker-index', '--ci-build-id'])

export interface RecordSettings {
  ciBuildId?: string
}

export const workerArgv = (argv: string[], workerIndex: number, record?: RecordSettings) => {
  const args: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const [flag] = arg.split('=')

    if (flagsWithValue.has(flag)) {
      if (!arg.includes('=')) i++

      continue
    }

    // a second debugger on the same port would fail to bind
    if (flag.startsWith('--inspect') || flag === '--parallel') continue

    args.push(arg)
  }

  const recordArgs = record ? ['--parallel', ...(record.ciBuildId ? ['--ci-build-id', record.ciBuildId] : [])] : []

  return [...args, ...recordArgs, '--worker-index', String(workerIndex), '--port', '0']
}

/** Splits a worker's stdout into whole-spec blocks. */
export class SpecOutputBuffer {
  private pending = ''

  constructor (private onBlock: (block: string) => void) {}

  write (chunk: string) {
    this.pending += chunk

    let end: number

    while ((end = this.pending.indexOf(SPEC_END_DELIMITER)) !== -1) {
      this.onBlock(this.pending.slice(0, end))
      this.pending = this.pending.slice(end + SPEC_END_DELIMITER.length)
    }
  }

  flush () {
    if (this.pending) {
      this.onBlock(this.pending)
      this.pending = ''
    }
  }
}

/** Holds everything written to stdout until the returned function is called, which restores stdout and returns what was held. */
export function holdStdout (): () => string {
  const held: string[] = []
  const { write } = process.stdout
  const { log } = process

  process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    held.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString())

    const callback = args.find((arg): arg is () => void => typeof arg === 'function')

    callback?.()

    return true
    // Safe because the replacement accepts the arguments of every `write` overload and returns its boolean
  }) as typeof process.stdout.write

  // Electron writes through process.log instead of stdout on Windows
  if (log) {
    process.log = (str: string) => {
      held.push(str)
    }
  }

  return () => {
    process.stdout.write = write
    process.log = log

    return held.join('')
  }
}

/** Prints whole blocks as they arrive, except while paused, when they wait and print in order on resume. */
export class BlockPrinter {
  private paused: string[] | undefined

  constructor (private write: (block: string) => void) {}

  print (block: string) {
    if (this.paused) {
      this.paused.push(block)
    } else {
      this.write(block)
    }
  }

  pause () {
    this.paused ??= []
  }

  resume () {
    const blocks = this.paused ?? []

    this.paused = undefined
    blocks.forEach((block) => this.write(block))
  }
}

type BeforeSpecRun = () => Promise<Claim>
type AfterSpecRun = (spec: SpecWithRelativeRoot, results: RunResult, config?: unknown) => Promise<unknown> | unknown

export interface SpecRunHooks {
  beforeSpecRun?: BeforeSpecRun
  afterSpecRun?: AfterSpecRun
}

export interface Coordinator {
  /**
   * `beforeSpecRun`/`afterSpecRun` for worker 0, the coordinator itself. Specs come from the
   * local queue, or from the given hooks when recording, where Cypress Cloud hands them out.
   */
  hooks: (cloud?: SpecRunHooks) => Required<SpecRunHooks> & {
    /** Resolves with every worker's runs, in spec order, once all workers have exited. */
    collectRuns: (ownRuns: RunResult[]) => Promise<RunResult[]>
  }
}

export function startCoordinator ({ specs, workers, downloadsFolder, durations, record, write = process.stdout.write.bind(process.stdout) }: {
  specs: SpecWithRelativeRoot[]
  workers: number
  downloadsFolder: string
  durations?: SpecDurations
  /** Set when recording: every worker joins the same Cloud run and gets its specs from Cloud. */
  record?: RecordSettings
  write?: (s: string) => void
}): Coordinator {
  const queue = new SpecQueue(specs, durations)
  const spawnCount = Math.min(workers, specs.length) - 1
  const exits: Promise<void>[] = []
  const children: ChildProcess[] = []

  const workerCount = spawnCount + 1
  let releaseOwnOutput: (() => string) | undefined
  let announced = false

  const printer = new BlockPrinter(write)
  const printBlock = (block: string) => printer.print(block)

  // goes through the current stdout.write, so record mode's capture of this spec's output sees it
  const printOwnOutput = () => {
    const held = releaseOwnOutput?.()

    releaseOwnOutput = undefined

    if (held) process.stdout.write(held)
  }

  const onExit = () => {
    printOwnOutput()
    printer.resume()
    children.forEach((child) => {
      if (child.exitCode === null) child.kill()
    })
  }

  process.once('exit', onExit)

  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: process.stdout.isTTY ? '1' : process.env.FORCE_COLOR }

  delete env.ELECTRON_RUN_AS_NODE

  for (let index = 1; index <= spawnCount; index++) {
    const args = workerArgv(process.argv.slice(1), index, record)

    debug('spawning worker %d: %s %o', index, process.execPath, args)

    const child = spawn(process.execPath, args, {
      stdio: ['ignore', 'pipe', 'inherit', 'ipc'],
      // keeps Dates and other non-JSON values in per-spec results intact
      serialization: 'advanced',
      env: {
        ...env,
        [WORKER_INDEX_ENV]: String(index),
        CYPRESS_DOWNLOADS_FOLDER: path.join(downloadsFolder, `worker-${index}`),
      },
    })

    children.push(child)

    const output = new SpecOutputBuffer(printBlock)

    child.stdout!.setEncoding('utf8')
    child.stdout!.on('data', (chunk: string) => output.write(chunk))

    child.on('message', (message: WorkerMessage) => {
      if (message.type === 'claim') {
        const reply: CoordinatorMessage = { type: 'claimed', claim: queue.claim(index) }

        child.send(reply)
      } else if (message.type === 'started') {
        queue.start(index, message.spec)
      } else if (message.type === 'specResult') {
        queue.complete(index, message.results)
      }
    })

    exits.push(new Promise((resolve) => {
      child.once('exit', (code, signal) => {
        output.flush()
        debug('worker %d exited %o', index, { code, signal })

        const abandoned = queue.abandon(index, new Error(`The Cypress worker process running this spec exited unexpectedly (${signal ?? `code ${code}`}).`))

        if (abandoned) {
          printBlock(`${os.EOL}Worker ${index} exited while running ${abandoned}; the spec is marked as failed.${os.EOL}`)
        }

        resolve()
      })
    }))
  }

  return {
    hooks (cloud = {}) {
      return {
        async beforeSpecRun () {
          if (!announced) {
            announced = true
            const what = record ? 'specs from Cypress Cloud' : `${specs.length} specs`

            printBlock(chalk.gray(`${os.EOL}  Running ${what} on ${workerCount} workers. Each spec's output is printed when it finishes.${os.EOL}`))
          }

          const claim = cloud.beforeSpecRun ? await cloud.beforeSpecRun() : queue.claim(0)

          if (claim.spec) {
            if (cloud.beforeSpecRun) queue.start(0, claim.spec)

            releaseOwnOutput = holdStdout()
          }

          return claim
        },
        async afterSpecRun (spec, results, config) {
          // keeps other workers' blocks out of the artifact upload log Cloud's afterSpecRun prints
          printer.pause()

          try {
            printOwnOutput()
            queue.complete(0, results)
            await cloud.afterSpecRun?.(spec, results, config)
          } finally {
            printer.resume()
          }
        },
        async collectRuns () {
          printOwnOutput()
          await Promise.all(exits)
          process.removeListener('exit', onExit)

          return queue.runsInSpecOrder()
        },
      }
    },
  }
}

/**
 * `beforeSpecRun`/`afterSpecRun` for a spawned worker. Specs come from the coordinator over IPC,
 * or from the given hooks when recording; either way, results go back to the coordinator.
 */
export function workerHooks (cloud: SpecRunHooks = {}): Required<SpecRunHooks> {
  if (typeof process.send !== 'function') {
    throw new Error('A Cypress worker must be started by a coordinator with an IPC channel.')
  }

  const send = process.send.bind(process)
  // bound before record mode starts teeing stdout, so the delimiter is never uploaded to Cloud
  const rawWrite = process.stdout.write.bind(process.stdout)

  const claimFromCoordinator = () => {
    return new Promise<Claim>((resolve) => {
      const onMessage = (message: CoordinatorMessage) => {
        if (message?.type !== 'claimed') return

        process.removeListener('message', onMessage)
        resolve(message.claim)
      }

      process.on('message', onMessage)
      const claim: WorkerMessage = { type: 'claim' }

      send(claim)
    })
  }

  return {
    async beforeSpecRun () {
      if (!cloud.beforeSpecRun) return claimFromCoordinator()

      const claim = await cloud.beforeSpecRun()

      if (claim.spec) {
        const started: WorkerMessage = { type: 'started', spec: claim.spec }

        send(started)
      }

      return claim
    },
    async afterSpecRun (spec, results, config) {
      await cloud.afterSpecRun?.(spec, results, config)
      rawWrite(SPEC_END_DELIMITER)
      const message: WorkerMessage = { type: 'specResult', results }

      send(message)
    },
  }
}
