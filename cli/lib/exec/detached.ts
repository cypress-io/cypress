import os from 'os'
import path from 'path'
import { StringDecoder } from 'string_decoder'
import type { ChildProcess } from 'child_process'
import fs from 'fs-extra'
import { stdout, stderr } from 'process'

// Must match CYPRESS_OPEN_READY_MESSAGE in packages/server/lib/modes/interactive.ts
export const CYPRESS_OPEN_READY_MESSAGE = 'Cypress is ready'

const POLL_INTERVAL_MS = 100
const MAX_NAME_ATTEMPTS = 5

export interface DetachedOutput {
  outPath: string
  errPath: string
  outFd: number
  errFd: number
}

export interface ReadyResult {
  ready: boolean
  code: number
}

// Files rather than pipes: a pipe breaks once the CLI exits, while the app keeps logging
export async function openDetachedOutput (): Promise<DetachedOutput> {
  await pruneStaleDetachedOutput()

  const stem = path.join(os.tmpdir(), `cypress-open-${process.pid}-${Date.now()}`)

  // 'wx' fails on a file that already exists, so a file or link someone left at this
  // predictable name in a shared temp directory is never followed or appended to. Only the
  // person running Cypress needs to read what the app prints. Two runs in the same
  // millisecond take the next numbered name instead of failing.
  for (let attempt = 0; ; attempt++) {
    const base = attempt ? `${stem}-${attempt}` : stem
    const outPath = `${base}.out`
    const errPath = `${base}.err`

    let outFd: number | undefined

    try {
      outFd = await fs.open(outPath, 'wx', 0o600)

      return { outPath, errPath, outFd, errFd: await fs.open(errPath, 'wx', 0o600) }
    } catch (err) {
      if (outFd !== undefined) {
        await fs.close(outFd).catch(() => undefined)
        await fs.remove(outPath).catch(() => undefined)
      }

      if ((err as NodeJS.ErrnoException).code === 'EEXIST' && attempt < MAX_NAME_ATTEMPTS) {
        continue
      }

      throw err
    }
  }
}

const STALE_OUTPUT_MS = 7 * 24 * 60 * 60 * 1000
const OUTPUT_FILE = /^cypress-open-\d+-\d+(-\d+)?\.(out|err)$/

// The app keeps writing to these files after the CLI exits, so they cannot be removed
// on success. Older ones are removed the next time a detached run starts.
export async function pruneStaleDetachedOutput (now: number = Date.now()): Promise<void> {
  try {
    const dir = os.tmpdir()

    await Promise.all((await fs.readdir(dir)).filter((name) => OUTPUT_FILE.test(name)).map(async (name) => {
      const file = path.join(dir, name)

      if (now - (await fs.stat(file)).mtimeMs > STALE_OUTPUT_MS) {
        await fs.remove(file)
      }
    }))
  } catch {
    // Best effort: a file that cannot be listed or removed is left for next time
  }
}

export async function closeDetachedOutput ({ outFd, errFd }: DetachedOutput): Promise<void> {
  await Promise.all([outFd, errFd].map((fd) => fs.close(fd).catch(() => undefined)))
}

export async function removeDetachedOutput ({ outPath, errPath }: DetachedOutput): Promise<void> {
  await Promise.all([outPath, errPath].map((file) => fs.remove(file).catch(() => undefined)))
}

// Only the bytes after `offset`, so a long-running app's log is not read again from the start on every poll
async function readFrom (file: string, offset: number): Promise<Buffer> {
  try {
    const handle = await fs.open(file, 'r')

    try {
      const { size } = await fs.fstat(handle)

      if (size <= offset) {
        return Buffer.alloc(0)
      }

      const chunk = Buffer.alloc(size - offset)
      const { bytesRead } = await fs.read(handle, chunk, 0, chunk.length, offset)

      return chunk.subarray(0, bytesRead)
    } finally {
      await fs.close(handle)
    }
  } catch {
    return Buffer.alloc(0)
  }
}

// The CLI's own output closing (a pipe the caller stopped reading) must not crash the wait
function write (stream: NodeJS.WriteStream, chunk: string | Buffer): void {
  try {
    stream.write(chunk)
  } catch {
    // nothing to report to
  }
}

// The length of the longest suffix of `text` that could still become the start of the sentinel
function partialSentinelLength (text: string): number {
  const max = Math.min(text.length, CYPRESS_OPEN_READY_MESSAGE.length - 1)

  for (let length = max; length > 0; length--) {
    if (CYPRESS_OPEN_READY_MESSAGE.startsWith(text.slice(-length))) {
      return length
    }
  }

  return 0
}

/**
 * Polls the files the app writes to, forwarding anything printed before the
 * ready message to the CLI's own output.
 * Resolves with `ready: true` once the ready message is seen, or with the
 * child's exit code if it closes first.
 */
export function waitForReadyMessage (
  outPath: string,
  errPath: string,
  child: ChildProcess,
  onStderr: (chunk: Buffer) => void = (chunk) => {
    write(stderr, chunk)
  },
): Promise<ReadyResult> {
  return new Promise((resolve) => {
    const outDecoder = new StringDecoder('utf8')
    let outOffset = 0
    let errOffset = 0
    let held = ''
    let exit: number | undefined

    const forwardStderr = async () => {
      const chunk = await readFrom(errPath, errOffset)

      errOffset += chunk.length
      if (chunk.length) onStderr(chunk)
    }

    // Returns true when the ready message was found
    const forwardStdout = async (): Promise<boolean> => {
      const chunk = await readFrom(outPath, outOffset)

      outOffset += chunk.length

      const text = held + outDecoder.write(chunk)
      const readyIndex = text.indexOf(CYPRESS_OPEN_READY_MESSAGE)

      if (readyIndex !== -1) {
        held = ''
        if (readyIndex > 0) write(stdout, text.slice(0, readyIndex))

        return true
      }

      // The ready message may be split across two reads, so hold back anything that could be its start
      const holdLength = exit === undefined ? partialSentinelLength(text) : 0

      held = text.slice(text.length - holdLength)

      const forward = text.slice(0, text.length - holdLength)

      if (forward) write(stdout, forward)

      return false
    }

    let wake: (() => void) | undefined

    const sleep = () => {
      return new Promise<void>((done) => {
        const timer = setTimeout(done, POLL_INTERVAL_MS)

        wake = () => {
          clearTimeout(timer)
          done()
        }
      })
    }

    const onExit = (code: number) => {
      exit = code
      wake?.()
    }

    child.once('close', (code: number | null, signal: NodeJS.Signals | null) => {
      onExit(code ?? (signal ? 128 + os.constants.signals[signal] : 1))
    })

    child.once('error', () => onExit(1))

    const poll = async (): Promise<ReadyResult> => {
      for (;;) {
        // Reads that start after the child is known to be gone also drain what it wrote just before exiting
        const exited = exit !== undefined

        const ready = await forwardStdout()

        await forwardStderr()

        if (ready) {
          return { ready: true, code: 0 }
        }

        if (exited) {
          return { ready: false, code: exit as number }
        }

        await sleep()
      }
    }

    resolve(poll())
  })
}
