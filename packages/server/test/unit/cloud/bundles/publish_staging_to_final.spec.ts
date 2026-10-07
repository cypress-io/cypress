import { createRequire } from 'module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureDir, mkdtemp, pathExists, readFile, remove, writeFile } from 'fs-extra'
import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import { publishStagingToFinal } from '../../../../lib/cloud/bundles/publish_staging_to_final'

const { renameStub } = vi.hoisted(() => {
  return { renameStub: vi.fn() }
})

vi.mock('../../../../lib/cloud/extract_atomic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/cloud/extract_atomic')>()

  return { ...actual, renameAtomicWithRetry: renameStub }
})

const TS_REGISTER = createRequire(import.meta.url).resolve('@packages/ts/register')
const WORKER_PATH = path.resolve(__dirname, '../../../support/cross_process_publish_worker.ts')

const populateStaging = async (staging: string, files: Record<string, string>) => {
  await ensureDir(staging)
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(staging, rel)

    await ensureDir(path.dirname(full))
    await writeFile(full, content)
  }
}

const FIXTURE_FILES = (() => {
  const files: Record<string, string> = {
    'manifest.json': JSON.stringify({ version: 1, files: {} }),
    'server/index.js': '// hello cypress\n'.repeat(50),
    'README.md': 'bundle readme\n',
  }

  for (let i = 0; i < 30; i++) {
    files[`assets/file_${String(i).padStart(3, '0')}.txt`] = `payload-${i}\n`.repeat(20)
  }

  return files
})()

describe('publishStagingToFinal', () => {
  let tmp: string
  let staging: string
  let finalDir: string
  let actualRenameAtomicWithRetry: typeof import('../../../../lib/cloud/extract_atomic').renameAtomicWithRetry

  beforeEach(async () => {
    ({ renameAtomicWithRetry: actualRenameAtomicWithRetry } = await vi.importActual<typeof import('../../../../lib/cloud/extract_atomic')>('../../../../lib/cloud/extract_atomic'))
    renameStub.mockReset()
    renameStub.mockImplementation(actualRenameAtomicWithRetry)

    tmp = await mkdtemp(path.join(os.tmpdir(), 'cy-publish-'))
    staging = path.join(tmp, 'staging')
    finalDir = path.join(tmp, 'final')
    await ensureDir(finalDir)
  })

  afterEach(async () => {
    await remove(tmp).catch(() => { /* ignore */ })
  })

  it('publishes all files from staging into finalDir', async () => {
    await populateStaging(staging, FIXTURE_FILES)

    await publishStagingToFinal(staging, finalDir)

    for (const [rel, expected] of Object.entries(FIXTURE_FILES)) {
      const actual = await readFile(path.join(finalDir, rel), 'utf8')

      expect(actual).toBe(expected)
    }
  })

  it('renames manifest.json last', async () => {
    await populateStaging(staging, FIXTURE_FILES)

    const renamedOrder: string[] = []

    renameStub.mockImplementation(async (src: string, dst: string) => {
      await actualRenameAtomicWithRetry(src, dst)
      renamedOrder.push(path.relative(finalDir, dst).split(path.sep).join('/'))
    })

    await publishStagingToFinal(staging, finalDir)

    expect(renamedOrder.length).toBe(Object.keys(FIXTURE_FILES).length)
    expect(renamedOrder[renamedOrder.length - 1]).toBe('manifest.json')
    // every non-manifest entry must precede manifest in the order
    const manifestIdx = renamedOrder.indexOf('manifest.json')

    expect(manifestIdx).toBe(renamedOrder.length - 1)
  })

  it('drains in-flight renames before throwing when one rejects (no unhandled-rejection leakage)', async () => {
    await populateStaging(staging, FIXTURE_FILES)

    const fastReject = vi.fn().mockRejectedValue(Object.assign(new Error('EACCES: denied'), { code: 'EACCES' }))
    let slowResolved = false
    const slowResolve = vi.fn(async (_src: string, _dst: string) => {
      await new Promise((r) => setTimeout(r, 50))
      slowResolved = true
    })

    renameStub.mockImplementation(async (src: string, _dst: string) => {
      if (src.endsWith('assets/file_000.txt')) return fastReject(src, _dst)

      return slowResolve(src, _dst)
    })

    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)

    process.on('unhandledRejection', onUnhandled)

    try {
      await expect(publishStagingToFinal(staging, finalDir)).rejects.toThrow(/EACCES/)
      await new Promise((r) => setTimeout(r, 100))
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }

    expect(slowResolved, 'slow renames should have settled before the function returned').toBe(true)
    expect(unhandled, 'no unhandled rejections from in-flight publishOne calls').toEqual([])
  })

  it('cross-process: parallel publishers + reader sees no absent or partial bytes', { timeout: 30000 }, async () => {
    const stagingA = path.join(tmp, 'staging-a')
    const stagingB = path.join(tmp, 'staging-b')
    const watchedFile = 'assets/file_010.txt'
    const expectedContent = FIXTURE_FILES[watchedFile]

    // Pre-place the watched file so the reader has a baseline before either
    // publisher renames over it.
    await ensureDir(path.dirname(path.join(finalDir, watchedFile)))
    await writeFile(path.join(finalDir, watchedFile), expectedContent)

    await populateStaging(stagingA, FIXTURE_FILES)
    await populateStaging(stagingB, FIXTURE_FILES)

    let stop = false
    let reads = 0
    let enoentObserved = 0
    const corruptObserved: string[] = []

    const readerLoop = (async () => {
      while (!stop) {
        try {
          const buf = await readFile(path.join(finalDir, watchedFile), 'utf8')

          reads++
          if (buf !== expectedContent) corruptObserved.push(buf.slice(0, 50))
        } catch (err: any) {
          if (err?.code === 'ENOENT') enoentObserved++
          else throw err
        }
      }
    })()

    const runChild = (staging: string) => {
      return new Promise<{ code: number, stderr: string }>((resolve, reject) => {
        const child = spawn(process.execPath, ['-r', TS_REGISTER, WORKER_PATH, staging, finalDir], {
          stdio: ['ignore', 'ignore', 'pipe'],
        })
        let stderr = ''

        child.stderr.on('data', (chunk) => stderr += chunk.toString('utf8'))
        child.once('error', reject)
        child.once('exit', (code) => resolve({ code: code ?? -1, stderr }))
      })
    }

    const [childA, childB] = await Promise.all([runChild(stagingA), runChild(stagingB)])

    stop = true
    await readerLoop

    if (childA.code !== 0) throw new Error(`child A exited with ${childA.code}: ${childA.stderr}`)

    if (childB.code !== 0) throw new Error(`child B exited with ${childB.code}: ${childB.stderr}`)

    expect(enoentObserved, 'reader must never see ENOENT for an already-published file').toBe(0)
    expect(corruptObserved, 'reader must always read complete bytes').toEqual([])
    expect(reads, 'reader loop should run at least once').toBeGreaterThan(0)

    // After both publishers exit, finalDir must contain every file from the bundle.
    for (const rel of Object.keys(FIXTURE_FILES)) {
      const dst = path.join(finalDir, rel)

      expect(await pathExists(dst), `${rel} must exist in finalDir`).toBe(true)
      const actual = await readFile(dst, 'utf8')

      expect(actual, `${rel} content must match expected`).toBe(FIXTURE_FILES[rel])
    }
  })
})
