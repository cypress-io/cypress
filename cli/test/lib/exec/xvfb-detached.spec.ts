import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { DetachedXvfb } from '../../../lib/exec/xvfb'

// The real @cypress/xvfb, with a stand-in `Xvfb` first on PATH: it takes the same lock file a real
// one does, so what is under test is how the process is started, not the X server.
const DISPLAY_NUM = 187
const LOCK_FILE = `/tmp/.X${DISPLAY_NUM}-lock`

const groupOf = (pid: number): number => Number(execSync(`ps -o pgid= -p ${pid}`).toString().trim())

describe.skipIf(os.platform() === 'win32')('lib/exec/xvfb DetachedXvfb', function () {
  let binDir: string
  let originalPath: string | undefined
  let originalDisplay: string | undefined
  let started: DetachedXvfb | undefined

  const installFakeXvfb = (body: string) => {
    fs.writeFileSync(path.join(binDir, 'Xvfb'), `#!/bin/sh\n${body}\n`, { mode: 0o755 })
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
    process.env.PATH = `${binDir}${path.delimiter}${originalPath}`
    fs.rmSync(LOCK_FILE, { force: true })
  })

  afterEach(function () {
    started?._process?.kill()
    started = undefined
    fs.rmSync(LOCK_FILE, { force: true })
    fs.rmSync(binDir, { recursive: true, force: true })
    process.env.PATH = originalPath

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

  it('reports an Xvfb that exits with an error as a non-zero exit', async function () {
    installFakeXvfb('exit 3')

    await expect(start(new DetachedXvfb({ displayNum: DISPLAY_NUM, timeout: 5000 }))).rejects.toMatchObject({ nonZeroExitCode: true })
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
})
