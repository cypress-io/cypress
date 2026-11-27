import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import cp, { execSync } from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs'
import fsExtra from 'fs-extra'
import os from 'os'
import path from 'path'
import xvfb, { DetachedXvfb } from '../../../lib/exec/xvfb'
import logger from '../../../lib/logger'

// The real @cypress/xvfb, with a stand-in `Xvfb` first on PATH: it takes the same lock file a real
// one does, so what is under test is how the process is started, not the X server.
const DISPLAY_NUM = 187
const LOCK_FILE = `/tmp/.X${DISPLAY_NUM}-lock`

const groupOf = (pid: number): number => Number(execSync(`ps -o pgid= -p ${pid}`).toString().trim())

describe.skipIf(os.platform() === 'win32')('lib/exec/xvfb DetachedXvfb', function () {
  let binDir: string
  let originalPath: string | undefined
  let originalDisplay: string | undefined
  let originalDisplayNum: string | undefined
  let originalSharedDisplay: string | null
  let started: DetachedXvfb | undefined

  const installFakeXvfb = (body: string) => {
    fs.writeFileSync(path.join(binDir, 'Xvfb'), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
  }

  // For a fake Xvfb that records its pid in the lock file of the display it was given
  const stopFakeXvfb = async (display: string): Promise<void> => {
    const lockFile = `/tmp/.X${display.slice(1)}-lock`
    const pid = Number((await fsExtra.readFile(lockFile, 'utf8')).trim())

    process.kill(pid)
    await fsExtra.remove(lockFile)
  }

  const start = (xvfb: DetachedXvfb): Promise<void> => {
    started = xvfb

    return new Promise((resolve, reject) => {
      xvfb.start((err: Error | null) => (err ? reject(err) : resolve()))
    })
  }

  beforeEach(function () {
    binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-xvfb-'))
    originalPath = process.env.PATH
    originalDisplay = process.env.DISPLAY
    originalDisplayNum = xvfb._xvfbOptions.displayNum
    originalSharedDisplay = xvfb._xvfb._display
    process.env.PATH = `${binDir}${path.delimiter}${originalPath}`
    fs.rmSync(LOCK_FILE, { force: true })
  })

  afterEach(function () {
    started?._process?.kill()
    started = undefined
    fs.rmSync(LOCK_FILE, { force: true })
    fs.rmSync(binDir, { recursive: true, force: true })
    process.env.PATH = originalPath
    xvfb._xvfbOptions.displayNum = originalDisplayNum
    xvfb._xvfb._display = originalSharedDisplay

    if (originalDisplay === undefined) {
      delete process.env.DISPLAY
    } else {
      process.env.DISPLAY = originalDisplay
    }

    vi.restoreAllMocks()
  })

  it('starts Xvfb as the leader of a process group of its own, with no pipes to the caller', async function () {
    installFakeXvfb(`touch ${LOCK_FILE}\nexec sleep 30`)

    const xvfb = new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 })

    await start(xvfb)
    const proc = xvfb._process

    expect(process.env.DISPLAY).toBe(`:${DISPLAY_NUM}`)
    expect(fs.existsSync(LOCK_FILE)).toBe(true)
    expect(groupOf(proc.pid)).toBe(proc.pid)
    expect(groupOf(proc.pid)).not.toBe(groupOf(process.pid))
    expect(proc.stdout).toBeNull()
    expect(proc.stderr).toBeNull()
  })

  it('starts Xvfb with -terminate, so it exits once the app it was started for has closed', async function () {
    const argsFile = path.join(binDir, 'args')

    installFakeXvfb(`echo "$@" > ${argsFile}\ntouch ${LOCK_FILE}\nexec sleep 30`)

    await start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000, xvfb_args: ['-screen', '0', '1280x1024x24'] }))

    expect(fs.readFileSync(argsFile, 'utf8').trim()).toBe(`:${DISPLAY_NUM} -terminate -screen 0 1280x1024x24`)
  })

  it('reports an Xvfb that exits with an error as a non-zero exit', async function () {
    installFakeXvfb('exit 3')

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 }))).rejects.toMatchObject({ nonZeroExitCode: true })
  })

  it('names the signal that killed an Xvfb that did not start', async function () {
    installFakeXvfb('kill -9 $$')

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 }))).rejects.toThrow('Xvfb was killed by SIGKILL')
  })

  it('starts a Xvfb of its own for each launch, and gives DISPLAY back once released', async function () {
    // Each fake Xvfb takes the lock file of the display it was given and records its pid there
    installFakeXvfb('echo $$ > "/tmp/.X${1#:}-lock"\nexec sleep 30')
    delete process.env.DISPLAY

    const displays: string[] = []

    try {
      await xvfb.start({ detached: true })
      displays.push(process.env.DISPLAY!)
      xvfb.release()

      expect(process.env.DISPLAY).toBeUndefined()

      await xvfb.start({ detached: true })
      displays.push(process.env.DISPLAY!)

      expect(displays[1]).not.toBe(displays[0])
    } finally {
      for (const display of displays) {
        await stopFakeXvfb(display)
      }

      xvfb.release()
    }
  })

  it('reports what an Xvfb that exits with an error printed', async function () {
    installFakeXvfb('echo "Fatal server error: no screens found" >&2\nexit 1')

    const onStderrData = vi.fn()

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000, onStderrData }))).rejects.toThrow('Xvfb exited with code 1:\nFatal server error: no screens found')
    expect(onStderrData).toHaveBeenCalledWith('Fatal server error: no screens found')
  })

  it('reports what an Xvfb that never creates its display printed', async function () {
    installFakeXvfb('echo "waiting for a lock" >&2\nexec sleep 30')

    const onStderrData = vi.fn()

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 200, onStderrData }))).rejects.toMatchObject({ timedOut: true })
    expect(onStderrData).toHaveBeenCalledWith('waiting for a lock')
  })

  it('leaves no file for its output behind once started', async function () {
    installFakeXvfb(`echo "started" >&2\ntouch ${LOCK_FILE}\nexec sleep 30`)

    const mkdtemp = vi.spyOn(fsExtra, 'mkdtemp')
    const onStderrData = vi.fn()

    await start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000, onStderrData }))

    const dir = await mkdtemp.mock.results[0].value

    expect(fs.existsSync(dir)).toBe(false)
    expect(onStderrData).not.toHaveBeenCalled()
  })

  it('refuses a display that is already in use', async function () {
    installFakeXvfb(`touch ${LOCK_FILE}\nexec sleep 30`)
    fs.writeFileSync(LOCK_FILE, '')

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 }))).rejects.toThrow('already in use')
  })

  it('reports a missing Xvfb binary', async function () {
    process.env.PATH = binDir

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 }))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('reports a spawn failure once when the process emits both error and exit', async function () {
    const proc = Object.assign(new EventEmitter(), { unref: vi.fn() })

    vi.spyOn(cp, 'spawn').mockReturnValue(proc as any)

    const xvfb = new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 })
    const onError = vi.fn()

    xvfb._spawnProcess(false, onError)
    proc.emit('error', Object.assign(new Error('spawn Xvfb ENOENT'), { code: 'ENOENT' }))
    proc.emit('exit', -2, null)

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ENOENT' }))
  })

  it('does not pick the display it is told to avoid', function () {
    const firstFree = Number(new DetachedXvfb({}).display().slice(1))

    expect(new DetachedXvfb({ avoidDisplays: [firstFree] }).display()).not.toBe(`:${firstFree}`)
  })

  it('does not take the display the Xvfb that stops with the CLI has already picked', async function () {
    installFakeXvfb('echo $$ > "/tmp/.X${1#:}-lock"\nexec sleep 30')

    const shared = xvfb._xvfb.display()

    try {
      await xvfb.start({ detached: true })

      expect(process.env.DISPLAY).not.toBe(shared)
    } finally {
      await stopFakeXvfb(process.env.DISPLAY!)
      xvfb.release()
    }
  })

  it('leaves XVFB_DISPLAY_NUM to the Xvfb that stops with the CLI', async function () {
    installFakeXvfb('echo $$ > "/tmp/.X${1#:}-lock"\nexec sleep 30')
    xvfb._xvfbOptions.displayNum = String(DISPLAY_NUM)

    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)

    try {
      await xvfb.start({ detached: true })

      expect(process.env.DISPLAY).not.toBe(`:${DISPLAY_NUM}`)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('XVFB_DISPLAY_NUM is set and was ignored'))
    } finally {
      await stopFakeXvfb(process.env.DISPLAY!)
      xvfb.release()
    }
  })
})
