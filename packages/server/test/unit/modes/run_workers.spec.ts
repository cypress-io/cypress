import os from 'os'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as errors from '../../../lib/errors'
import * as gpu from '../../../lib/util/gpu'
import {
  availableMemoryMb,
  BlockPrinter,
  bundleFromCoordinator,
  holdStdout,
  startCoordinator,
  orderByDuration,
  readSpecDurations,
  writeSpecDurations,
  resolveWorkerCount,
  SPEC_END_DELIMITER,
  SpecOutputBuffer,
  SpecQueue,
  workerArgv,
  workerEnv,
  workerExitNotice,
  workerSpawnArgs,
} from '../../../lib/modes/run-workers'
import type { RunResult } from '../../../lib/modes/results'

const spec = (relative: string) => ({ relative, absolute: `/project/${relative}`, name: relative }) as any

const resultFor = (relative: string, failures = 0) => ({ spec: spec(relative), stats: { failures } }) as unknown as RunResult

describe('lib/modes/run-workers', () => {
  describe('SpecQueue', () => {
    it('hands each spec out once, in order, then signals the end with a null spec', () => {
      const queue = new SpecQueue([spec('a.cy.ts'), spec('b.cy.ts')])

      expect(queue.claim(0)).toEqual({ spec: 'a.cy.ts', claimedInstances: 1, totalInstances: 2, estimated: null, instanceId: '0' })
      expect(queue.claim(1)).toMatchObject({ spec: 'b.cy.ts', claimedInstances: 2 })
      expect(queue.claim(0)).toMatchObject({ spec: null, claimedInstances: 2, totalInstances: 2 })
    })

    it('returns runs in spec order regardless of finish order', () => {
      const queue = new SpecQueue([spec('a.cy.ts'), spec('b.cy.ts'), spec('c.cy.ts')])

      queue.claim(0)
      queue.claim(1)
      queue.claim(2)
      queue.complete(2, resultFor('c.cy.ts'))
      queue.complete(0, resultFor('a.cy.ts'))
      queue.complete(1, resultFor('b.cy.ts'))

      expect(queue.runsInSpecOrder().map((run) => run.spec.relative)).toEqual(['a.cy.ts', 'b.cy.ts', 'c.cy.ts'])
    })

    it('marks the in-flight spec of an exited worker as failed and leaves unclaimed specs for others', () => {
      const queue = new SpecQueue([spec('a.cy.ts'), spec('b.cy.ts')])

      queue.claim(1)

      expect(queue.abandon(1, new Error('worker died'))).toBe('a.cy.ts')
      expect(queue.claim(0)).toMatchObject({ spec: 'b.cy.ts' })

      const [crashed] = queue.runsInSpecOrder()

      expect(crashed).toMatchObject({ error: 'worker died', stats: { failures: 1, tests: 0 }, spec: { relative: 'a.cy.ts' } })
    })

    it('has nothing to abandon for a worker that finished its spec', () => {
      const queue = new SpecQueue([spec('a.cy.ts')])

      queue.claim(1)
      queue.complete(1, resultFor('a.cy.ts'))

      expect(queue.abandon(1, new Error('exit'))).toBeUndefined()
      expect(queue.runsInSpecOrder()).toHaveLength(1)
    })
  })

  describe('workerExitNotice', () => {
    it('names the spec a worker was running when it exited', () => {
      expect(workerExitNotice(2, { code: null, signal: 'SIGKILL', abandoned: 'a.cy.ts' })).toContain('Worker 2 exited while running a.cy.ts; the spec is marked as failed.')
    })

    it('reports a worker that exited early between specs, such as one whose dev server could not start', () => {
      expect(workerExitNotice(1, { code: 1, signal: null })).toContain('Worker 1 exited early (code 1); the other workers ran its share of the specs.')
    })

    it('says nothing when a worker finishes normally', () => {
      expect(workerExitNotice(1, { code: 0, signal: null })).toBeUndefined()
    })
  })

  describe('workerArgv', () => {
    it('drops coordinator-only flags and pins the worker index and a random port', () => {
      expect(workerArgv(['--run-project', '/p', '--workers', '3', '--port=8080', '--inspect-brk=9229', '--browser', 'chrome'], 2))
      .toEqual(['--run-project', '/p', '--browser', 'chrome', '--worker-index', '2', '--port', '0'])
    })

    it('joins recorded workers to the same parallel Cloud run', () => {
      expect(workerArgv(['--run-project', '/p', '--record', '--key', 'k', '--parallel', '--ci-build-id', 'from-cli', '--workers=2'], 1, { ciBuildId: 'local-123' }))
      .toEqual(['--run-project', '/p', '--record', '--key', 'k', '--parallel', '--ci-build-id', 'local-123', '--worker-index', '1', '--port', '0'])
    })

    it('leaves the build id to CI detection when there is none to share', () => {
      expect(workerArgv(['--record'], 1, {})).toEqual(['--record', '--parallel', '--worker-index', '1', '--port', '0'])
    })
  })

  describe('workerSpawnArgs', () => {
    it('starts a plain Node worker with the entry script', () => {
      expect(workerSpawnArgs(['--run-project', '/p'], 1, { entryScript: '/app/index.js' }))
      .toEqual(['/app/index.js', '--run-project', '/p', '--worker-index', '1', '--port', '0'])
    })

    it('lets Electron load the app itself', () => {
      expect(workerSpawnArgs(['--run-project', '/p'], 1)).toEqual(['--run-project', '/p', '--worker-index', '1', '--port', '0'])
    })
  })

  describe('workerEnv', () => {
    it('gives each worker its index and downloads folder, and leaves the fixed debugging port to the coordinator', () => {
      const env = workerEnv({ PATH: '/bin', ELECTRON_RUN_AS_NODE: '1', CYPRESS_REMOTE_DEBUGGING_PORT: '9222', FORCE_COLOR: '0' }, 2, '/project/downloads', true)

      expect(env).toEqual({
        PATH: '/bin',
        FORCE_COLOR: '1',
        CYPRESS_WORKER_INDEX: '2',
        CYPRESS_DOWNLOADS_FOLDER: path.join('/project/downloads', 'worker-2'),
      })
    })

    it('runs Electron as plain Node for a worker that does not need Electron', () => {
      expect(workerEnv({}, 1, '/d', false, true).ELECTRON_RUN_AS_NODE).toBe('1')
    })

    it('keeps the inherited FORCE_COLOR when stdout is not a terminal', () => {
      expect(workerEnv({ FORCE_COLOR: '0' }, 1, '/d', false).FORCE_COLOR).toBe('0')
    })
  })

  describe('SpecOutputBuffer', () => {
    it('emits whole spec blocks across chunk boundaries and flushes the remainder', () => {
      const blocks: string[] = []
      const buffer = new SpecOutputBuffer((block) => blocks.push(block))
      const [head, tail] = [SPEC_END_DELIMITER.slice(0, 5), SPEC_END_DELIMITER.slice(5)]

      buffer.write(`spec a line 1\nspec a line 2\n${head}`)
      expect(blocks).toEqual([])

      buffer.write(`${tail}spec b${SPEC_END_DELIMITER}trailing`)
      expect(blocks).toEqual(['spec a line 1\nspec a line 2\n', 'spec b'])

      buffer.flush()
      expect(blocks).toEqual(['spec a line 1\nspec a line 2\n', 'spec b', 'trailing'])
    })
  })

  describe('resolveWorkerCount', () => {
    beforeEach(() => {
      vi.spyOn(errors, 'warning').mockImplementation(() => undefined)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('throws for anything other than a positive integer or "auto"', async () => {
      for (const value of [0, -1, 1.5, 'three', true]) {
        await expect(resolveWorkerCount(value, 10, { availableMb: 99999 })).rejects.toMatchObject({ type: 'INVALID_WORKERS' })
      }
    })

    it('picks the smallest of cpus - 1, what fits in memory, and the spec count for "auto"', async () => {
      expect(await resolveWorkerCount('auto', 10, { cpus: 8, availableMb: 3000, perWorkerMb: 1000 })).toBe(3)
      expect(await resolveWorkerCount('auto', 10, { cpus: 4, availableMb: 99999, perWorkerMb: 1000 })).toBe(3)
      expect(await resolveWorkerCount('auto', 2, { cpus: 16, availableMb: 99999, perWorkerMb: 1000 })).toBe(2)
      expect(await resolveWorkerCount('auto', 10, { cpus: 1, availableMb: 100, perWorkerMb: 1000 })).toBe(1)
    })

    it('fits more workers in the same memory when rendering in software', async () => {
      const isSoftwareRendering = vi.spyOn(gpu, 'isSoftwareRendering').mockReturnValue(false)

      expect(await resolveWorkerCount('auto', 10, { cpus: 16, availableMb: 3600 })).toBe(2)

      isSoftwareRendering.mockReturnValue(true)

      expect(await resolveWorkerCount('auto', 10, { cpus: 16, availableMb: 3600 })).toBe(3)
    })

    it('warns but keeps an explicit count that exceeds available memory', async () => {
      expect(await resolveWorkerCount(6, 10, { availableMb: 2500, perWorkerMb: 1000 })).toBe(6)
      expect(errors.warning).toHaveBeenCalledWith('WORKERS_EXCEED_MEMORY', 6, 2, 2500)
    })

    it('does not warn when the explicit count fits', async () => {
      expect(await resolveWorkerCount(2, 10, { availableMb: 2500, perWorkerMb: 1000 })).toBe(2)
      expect(errors.warning).not.toHaveBeenCalled()
    })
  })

  describe('availableMemoryMb', () => {
    let root: string

    beforeEach(async () => {
      root = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-cgroup-'))
      vi.spyOn(os, 'totalmem').mockReturnValue(128 * 1024 ** 3)
    })

    afterEach(async () => {
      vi.restoreAllMocks()
      await fs.rm(root, { recursive: true, force: true })
    })

    it('uses the cgroup v2 limit minus usage inside a container', async () => {
      await fs.writeFile(path.join(root, 'memory.max'), `${4 * 1024 ** 3}\n`)
      await fs.writeFile(path.join(root, 'memory.current'), `${1024 ** 3}\n`)

      expect(await availableMemoryMb(root, async () => 64 * 1024 ** 3)).toBe(3072)
    })

    it('uses the cgroup v1 limit when v2 is absent', async () => {
      await fs.mkdir(path.join(root, 'memory'))
      await fs.writeFile(path.join(root, 'memory', 'memory.limit_in_bytes'), `${2 * 1024 ** 3}`)
      await fs.writeFile(path.join(root, 'memory', 'memory.usage_in_bytes'), `${1024 ** 3}`)

      expect(await availableMemoryMb(root, async () => 64 * 1024 ** 3)).toBe(1024)
    })

    it('uses system available memory when the cgroup is unlimited', async () => {
      await fs.writeFile(path.join(root, 'memory.max'), 'max\n')
      await fs.writeFile(path.join(root, 'memory.current'), `${1024 ** 3}`)

      expect(await availableMemoryMb(root, async () => 64 * 1024 ** 3)).toBe(64 * 1024)
    })
  })

  describe('spec durations', () => {
    it('claims specs longest first, with specs that have no recorded duration before them', () => {
      const specs = [spec('fast.cy.ts'), spec('new.cy.ts'), spec('slow.cy.ts')]
      const queue = new SpecQueue(specs, { 'fast.cy.ts': 100, 'slow.cy.ts': 5000 })

      expect([queue.claim(0), queue.claim(0), queue.claim(0)].map((claim) => claim.spec)).toEqual(['new.cy.ts', 'slow.cy.ts', 'fast.cy.ts'])
    })

    it('keeps the resolved order when no durations are recorded', () => {
      expect(orderByDuration([spec('b.cy.ts'), spec('a.cy.ts')], {}).map((s) => s.relative)).toEqual(['b.cy.ts', 'a.cy.ts'])
    })

    it('round-trips durations, keeping earlier entries and skipping specs whose tests never ran', async () => {
      const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'cy-durations-')), 'nested', 'spec-durations.json')
      const ran = { spec: spec('a.cy.ts'), tests: [{}], stats: { wallClockDuration: 1200 } } as unknown as RunResult
      const crashed = { spec: spec('b.cy.ts'), tests: [], stats: { wallClockDuration: 0 } } as unknown as RunResult

      expect(await readSpecDurations(file)).toEqual({})

      await writeSpecDurations(file, { 'b.cy.ts': 900, 'old.cy.ts': 10 }, [ran, crashed])

      expect(await readSpecDurations(file)).toEqual({ 'a.cy.ts': 1200, 'b.cy.ts': 900, 'old.cy.ts': 10 })
    })
  })

  describe('holdStdout', () => {
    it('holds stdout writes, calls their callbacks, and returns the held text on release', () => {
      const write = process.stdout.write
      const callback = vi.fn()
      const release = holdStdout()

      process.stdout.write('one ')
      process.stdout.write(Buffer.from('two'), callback)

      expect(callback).toHaveBeenCalled()
      expect(release()).toBe('one two')
      expect(process.stdout.write).toBe(write)
    })
  })

  describe('coordinator hooks when recording', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('takes specs from Cloud and writes held spec output where record mode captures it before Cloud uploads', async () => {
      const order: string[] = []
      const cloudClaims = [{ spec: 'a.cy.ts', claimedInstances: 1, totalInstances: 1, estimated: 100, instanceId: 'cloud-1' }, { spec: null, claimedInstances: 1, totalInstances: 1, estimated: null, instanceId: null }]
      let capture: ReturnType<typeof vi.spyOn> | undefined
      const cloud = {
        // record mode starts capturing the spec's stdout in its beforeSpecRun
        beforeSpecRun: vi.fn(async () => {
          capture = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            order.push(`captured ${chunk}`)

            return true
          })

          return cloudClaims.shift()!
        }),
        afterSpecRun: vi.fn(async () => {
          order.push('cloud upload')
          capture?.mockRestore()
        }),
      }
      const coordinator = startCoordinator({ specs: [spec('a.cy.ts')], workers: 1, downloadsFolder: '/downloads', record: {}, bundle: vi.fn(), write: () => {} })
      const hooks = coordinator.hooks(cloud)

      expect(await hooks.beforeSpecRun()).toMatchObject({ spec: 'a.cy.ts', instanceId: 'cloud-1' })

      process.stdout.write('spec output')

      expect(order).toEqual([])

      await hooks.afterSpecRun(spec('a.cy.ts'), resultFor('a.cy.ts'), {})

      expect(order).toEqual(['captured spec output', 'cloud upload'])
      expect(cloud.afterSpecRun).toHaveBeenCalledWith(spec('a.cy.ts'), resultFor('a.cy.ts'), {})

      expect(await hooks.beforeSpecRun()).toMatchObject({ spec: null })
      capture?.mockRestore()

      expect((await hooks.collectRuns([])).map((run) => run.spec.relative)).toEqual(['a.cy.ts'])
    })
  })

  describe('BlockPrinter', () => {
    it('prints blocks immediately, and in order after resume while paused', () => {
      const written: string[] = []
      const printer = new BlockPrinter((block) => written.push(block))

      printer.print('a')
      printer.pause()
      printer.print('b')
      printer.print('c')

      expect(written).toEqual(['a'])

      printer.resume()
      printer.print('d')

      expect(written).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('bundleFromCoordinator', () => {
    let sent: any[]
    let channel: EventEmitter & { send: (message: any) => boolean }

    beforeEach(() => {
      sent = []
      channel = Object.assign(new EventEmitter(), { send: (message: any) => sent.push(message) > 0 })
    })

    it('resolves each request with the output path the coordinator replies with', async () => {
      const bundle = bundleFromCoordinator(channel as any)
      const spec = bundle('/project/cypress/e2e/a.cy.ts')
      const support = bundle('/project/cypress/support/e2e.ts')

      expect(sent).toEqual([
        { type: 'bundle', id: 0, filePath: '/project/cypress/e2e/a.cy.ts' },
        { type: 'bundle', id: 1, filePath: '/project/cypress/support/e2e.ts' },
      ])

      channel.emit('message', { type: 'claimed', claim: {} })
      channel.emit('message', { type: 'bundled', id: 1, outputPath: '/bundles/support.js' })
      channel.emit('message', { type: 'bundled', id: 0, outputPath: '/bundles/a.js' })

      expect(await spec).toBe('/bundles/a.js')
      expect(await support).toBe('/bundles/support.js')
    })

    it('rejects with an error that keeps the fields the spec controller reports', async () => {
      const bundle = bundleFromCoordinator(channel as any)
      const result = bundle('/project/cypress/e2e/a.cy.ts')

      channel.emit('message', { type: 'bundleError', id: 0, error: { message: 'Module not found', originalStack: 'at a.cy.ts:1', filePath: '/project/cypress/e2e/a.cy.ts' } })

      await expect(result).rejects.toMatchObject({ message: 'Module not found', originalStack: 'at a.cy.ts:1', filePath: '/project/cypress/e2e/a.cy.ts' })
    })
  })
})
