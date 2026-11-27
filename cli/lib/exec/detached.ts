import os from 'os'
import path from 'path'
import { StringDecoder } from 'string_decoder'
import type { ChildProcess } from 'child_process'
import fs from 'fs-extra'
import { stdout, stderr } from 'process'

// Must match CYPRESS_OPEN_READY_MESSAGE in packages/server/lib/modes/interactive.ts
export const CYPRESS_OPEN_READY_MESSAGE = 'Cypress is ready'

export const POLL_INTERVAL_MS = 100

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

export const signalExitCode = (signal: NodeJS.Signals): number => 128 + os.constants.signals[signal]

// Files rather than pipes: a pipe breaks once the CLI exits, while the app keeps logging
export async function openDetachedOutput (): Promise<DetachedOutput> {
  void pruneStaleDetachedOutput()

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

      if (err instanceof Error && 'code' in err && err.code === 'EEXIST' && attempt < MAX_NAME_ATTEMPTS) {
        continue
      }

      throw err
    }
  }
}

const STALE_OUTPUT_MS = 7 * 24 * 60 * 60 * 1000
const OUTPUT_FILE = /^cypress-open-\d+-\d+(?:-\d+)?(?:-app(\d+))?\.(?:out|err)$/

function isRunning (pid: number): boolean {
  try {
    process.kill(pid, 0)

    return true
  } catch (err) {
    return err instanceof Error && 'code' in err && err.code === 'EPERM'
  }
}

// The app keeps writing to these files after the CLI exits, so they cannot be removed
// on success. Older ones are removed the next time a detached run starts, unless the app
// they are named for is still running and has only been quiet.
export async function pruneStaleDetachedOutput (now: number = Date.now()): Promise<void> {
  try {
    const dir = os.tmpdir()

    await Promise.all((await fs.readdir(dir)).map(async (name) => {
      const match = OUTPUT_FILE.exec(name)

      if (!match || (match[1] && isRunning(Number(match[1])))) {
        return
      }

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

const withAppPid = (file: string, pid: number): string => file.replace(/\.(out|err)$/, `-app${pid}.$1`)

// Puts the app's pid in the names of its output files, so pruning can tell they are still in use.
// A file that cannot be renamed keeps its name, which only makes it prunable after a week.
export async function nameForApp (output: DetachedOutput, pid: number | undefined): Promise<DetachedOutput> {
  if (!pid) {
    return output
  }

  const rename = async (file: string): Promise<string> => {
    const named = withAppPid(file, pid)

    return fs.rename(file, named).then(() => named, () => file)
  }

  const [outPath, errPath] = await Promise.all([rename(output.outPath), rename(output.errPath)])

  return { ...output, outPath, errPath }
}

// For output that no app was started with
export async function discardDetachedOutput (output: DetachedOutput): Promise<void> {
  await closeDetachedOutput(output)
  await removeDetachedOutput(output)
}

// Undefined when the file cannot be opened yet, so the next poll tries again
const openForReading = (file: string): Promise<number | undefined> => fs.open(file, 'r').catch(() => undefined)

// Only the bytes after `offset`, so a long-running app's log is not read again from the start on every poll
async function readFrom (fd: number | undefined, offset: number): Promise<Buffer> {
  if (fd === undefined) {
    return Buffer.alloc(0)
  }

  try {
    const { size } = await fs.fstat(fd)

    if (size <= offset) {
      return Buffer.alloc(0)
    }

    const chunk = Buffer.alloc(size - offset)
    const { bytesRead } = await fs.read(fd, chunk, 0, chunk.length, offset)

    return chunk.subarray(0, bytesRead)
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
 * Resolves with `ready: true` once the ready message is seen and the child is
 * still running one poll interval later. Resolves with `ready: false` and the
 * child's exit code if it exits before then, forwarding what it printed after
 * the ready message, since nothing is handed off.
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
    let readySeen = false
    // Only shown if the app turns out to be gone, since otherwise it keeps going to the files
    let afterReady = ''
    let exit: number | undefined
    let outFd: number | undefined
    let errFd: number | undefined

    const forwardStderr = async () => {
      errFd = errFd ?? await openForReading(errPath)

      const chunk = await readFrom(errFd, errOffset)

      errOffset += chunk.length
      if (chunk.length) onStderr(chunk)
    }

    // Returns true when the ready message was found
    const forwardStdout = async (): Promise<boolean> => {
      outFd = outFd ?? await openForReading(outPath)

      const chunk = await readFrom(outFd, outOffset)

      outOffset += chunk.length

      if (readySeen) {
        afterReady += outDecoder.write(chunk)

        return true
      }

      const text = held + outDecoder.write(chunk)
      const readyIndex = text.indexOf(CYPRESS_OPEN_READY_MESSAGE)

      if (readyIndex !== -1) {
        readySeen = true
        held = ''
        afterReady = text.slice(readyIndex + CYPRESS_OPEN_READY_MESSAGE.length)
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

    // An exit that arrived during the reads had no sleep to wake, so it is not waited out
    const sleep = () => {
      return new Promise<void>((done) => {
        if (exit !== undefined) {
          return done()
        }

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

    // 'exit' rather than 'close', which also waits for any stdio pipes to close: the app's output is
    // read from files, and the ready check needs to see the exit as soon as Node reports it
    child.once('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      onExit(code ?? (signal ? signalExitCode(signal) : 1))
    })

    child.once('error', () => onExit(1))

    const poll = async (): Promise<ReadyResult> => {
      try {
        for (;;) {
          // Reads that start after the child is known to be gone also drain what it wrote just before exiting
          const exitedWith = exit

          const ready = await forwardStdout()

          await forwardStderr()

          if (ready) {
            // An app that crashes just after printing the ready message may not be reported as exited
            // yet, so its exit gets one more interval to arrive before the app is handed off. Timers
            // run before Node handles an exit that is already pending, so `exit` is only read once
            // setImmediate has let that happen.
            await sleep()
            await new Promise((resolve) => setImmediate(resolve))

            if (exit === undefined) {
              return { ready: true, code: 0 }
            }

            // An app that printed the ready message and has already exited is not running to be handed off
            if (exitedWith === undefined) {
              await forwardStdout()
              await forwardStderr()
            }

            const remaining = afterReady.replace(/^\r?\n/, '')

            if (remaining) write(stdout, remaining)

            return { ready: false, code: exit }
          }

          if (exitedWith !== undefined) {
            return { ready: false, code: exitedWith }
          }

          await sleep()
        }
      } finally {
        await Promise.all([outFd, errFd].map((fd) => (fd === undefined ? undefined : fs.close(fd).catch(() => undefined))))
      }
    }

    resolve(poll())
  })
}
