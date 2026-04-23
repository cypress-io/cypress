import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'
import crypto from 'crypto'

// Mock the app-data-paths module so descriptor files land in a tmpdir. We do
// this before requiring anything that transitively loads ServersActions.
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-test-'))
const runningPath = path.join(tmpRoot, 'running')

jest.mock('../../../src/util/app-data-paths', () => {
  const pathMod = require('path')

  return {
    runningDir: () => runningPath,
    descriptorFilePath: (pid: number) => pathMod.join(runningPath, `${pid}.json`),
  }
})

// eslint-disable-next-line import/first
import type { DataContext } from '../../../src'
// eslint-disable-next-line import/first
import { _resetExitHandlersRegisteredForTests, ServersActions } from '../../../src/actions/ServersActions'
// eslint-disable-next-line import/first
import { createTestDataContext } from '../helper'

const pkg = require('@packages/root')

/**
 * Build a DataContext without passing `projectRoot` through modeOptions (which
 * would trigger `process.chdir` inside ProjectLifecycleManager). We set the
 * `currentProject` directly on coreData after construction.
 */
function buildCtx (currentProject: string | null = null): DataContext {
  const ctx = createTestDataContext('open')

  ctx.update((d) => {
    d.currentProject = currentProject
    d.servers.gqlServerPort = 59123
  })

  return ctx
}

describe('ServersActions — instance descriptor', () => {
  let originalPid: number

  // Each test re-registers exit/SIGINT/SIGTERM handlers that intentionally
  // survive for the life of the process. Raise the cap to avoid the noisy
  // MaxListenersExceeded warning during this suite.
  process.setMaxListeners(50)

  beforeEach(() => {
    originalPid = process.pid
    _resetExitHandlersRegisteredForTests()
    // Clean the running dir between tests.
    if (fs.existsSync(runningPath)) {
      for (const name of fs.readdirSync(runningPath)) {
        fs.unlinkSync(path.join(runningPath, name))
      }
    }
  })

  afterEach(() => {
    Object.defineProperty(process, 'pid', { value: originalPid, configurable: true })
  })

  function stubPid (pid: number) {
    Object.defineProperty(process, 'pid', { value: pid, configurable: true })
  }

  it('writeInstanceDescriptor creates a file at the expected path', () => {
    stubPid(11111)
    const ctx = buildCtx('/home/me/my-project')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()

    expect(fs.existsSync(path.join(runningPath, '11111.json'))).toBe(true)
  })

  it('descriptor has all 8 fields with correct types', () => {
    stubPid(22222)
    const ctx = buildCtx('/home/me/typed-project')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()

    const raw = fs.readFileSync(path.join(runningPath, '22222.json'), 'utf8')
    const descriptor = JSON.parse(raw)

    expect(Object.keys(descriptor).sort()).toEqual([
      'cypressVersion',
      'pid',
      'port',
      'projectHash',
      'projectRoot',
      'startedAt',
      'token',
    ].sort())

    expect(typeof descriptor.pid).toBe('number')
    expect(typeof descriptor.port).toBe('number')
    expect(typeof descriptor.token).toBe('string')
    expect(typeof descriptor.projectRoot).toBe('string')
    expect(typeof descriptor.projectHash).toBe('string')
    expect(typeof descriptor.cypressVersion).toBe('string')
    expect(typeof descriptor.startedAt).toBe('string')
    expect(descriptor.cypressVersion).toBe(pkg.version)
    expect(new Date(descriptor.startedAt).toISOString()).toBe(descriptor.startedAt)
  })

  it('token is 64 hex characters', () => {
    stubPid(33333)
    const ctx = buildCtx('/home/me/token-project')

    new ServersActions(ctx).writeInstanceDescriptor()

    const descriptor = JSON.parse(fs.readFileSync(path.join(runningPath, '33333.json'), 'utf8'))

    expect(descriptor.token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('descriptor file is written with mode 0o600', () => {
    stubPid(44444)
    const ctx = buildCtx('/home/me/mode-project')

    new ServersActions(ctx).writeInstanceDescriptor()

    const stat = fs.statSync(path.join(runningPath, '44444.json'))

    // eslint-disable-next-line no-bitwise
    expect(stat.mode & 0o777).toBe(0o600)
  })

  it('parent running/ directory is created with mode 0o700', () => {
    if (fs.existsSync(runningPath)) {
      fs.rmSync(runningPath, { recursive: true, force: true })
    }

    stubPid(55555)
    const ctx = buildCtx('/home/me/dir-mode-project')

    new ServersActions(ctx).writeInstanceDescriptor()

    const stat = fs.statSync(runningPath)

    // eslint-disable-next-line no-bitwise
    expect(stat.mode & 0o777).toBe(0o700)
  })

  it('populates coreData.servers.inspect with { token, descriptorPath, startedAt }', () => {
    stubPid(66666)
    const ctx = buildCtx('/home/me/inspect-state')

    new ServersActions(ctx).writeInstanceDescriptor()

    const inspect = ctx.coreData.servers.inspect

    expect(inspect).toBeDefined()
    expect(inspect?.token).toMatch(/^[0-9a-f]{64}$/)
    expect(inspect?.descriptorPath).toBe(path.join(runningPath, '66666.json'))
    expect(inspect?.startedAt).toBeDefined()
    expect(new Date(inspect!.startedAt).toISOString()).toBe(inspect!.startedAt)
  })

  it('refreshInstanceDescriptor preserves token and startedAt while updating projectRoot', () => {
    stubPid(202020)
    const ctx = buildCtx(null)
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()

    const filePath = path.join(runningPath, '202020.json')
    const initial = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    expect(initial.projectRoot).toBeNull()
    expect(initial.projectHash).toBeNull()

    // Simulate the user picking a project from Launchpad.
    ctx.update((d) => {
      d.currentProject = '/home/me/picked'
    })

    actions.refreshInstanceDescriptor()

    const refreshed = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    expect(refreshed.token).toBe(initial.token)
    expect(refreshed.startedAt).toBe(initial.startedAt)
    expect(refreshed.projectRoot).toBe('/home/me/picked')
    expect(refreshed.projectHash).toBe(crypto.createHash('md5').update('/home/me/picked').digest('hex'))
    expect(ctx.coreData.servers.inspect?.token).toBe(initial.token)
    expect(ctx.coreData.servers.inspect?.startedAt).toBe(initial.startedAt)
  })

  it('refreshInstanceDescriptor clears projectRoot when currentProject returns to null', () => {
    stubPid(212121)
    const ctx = buildCtx('/home/me/will-clear')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()

    ctx.update((d) => {
      d.currentProject = null
    })

    actions.refreshInstanceDescriptor()

    const refreshed = JSON.parse(fs.readFileSync(path.join(runningPath, '212121.json'), 'utf8'))

    expect(refreshed.projectRoot).toBeNull()
    expect(refreshed.projectHash).toBeNull()
  })

  it('refreshInstanceDescriptor is a no-op when the initial descriptor has not been written', () => {
    stubPid(222222)
    const ctx = buildCtx('/home/me/no-initial')
    const actions = new ServersActions(ctx)

    actions.refreshInstanceDescriptor()

    expect(fs.existsSync(path.join(runningPath, '222222.json'))).toBe(false)
    expect(ctx.coreData.servers.inspect).toBeUndefined()
  })

  it('removeInstanceDescriptor deletes the file', () => {
    stubPid(77777)
    const ctx = buildCtx('/home/me/remove')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()
    const filePath = path.join(runningPath, '77777.json')

    expect(fs.existsSync(filePath)).toBe(true)

    actions.removeInstanceDescriptor()
    expect(fs.existsSync(filePath)).toBe(false)
  })

  it('removeInstanceDescriptor silently tolerates a missing file', () => {
    stubPid(88888)
    const ctx = buildCtx('/home/me/missing')
    const actions = new ServersActions(ctx)

    expect(() => actions.removeInstanceDescriptor()).not.toThrow()
  })

  it('removeInstanceDescriptor clears coreData.servers.inspect', () => {
    stubPid(99999)
    const ctx = buildCtx('/home/me/clear')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()
    expect(ctx.coreData.servers.inspect).toBeDefined()

    actions.removeInstanceDescriptor()
    expect(ctx.coreData.servers.inspect).toBeUndefined()
  })

  it('registers exit/SIGINT/SIGTERM handlers exactly once per process', () => {
    const spy = jest.spyOn(process, 'on')

    stubPid(101010)
    const ctx = buildCtx('/home/me/exit-once')
    const actions = new ServersActions(ctx)

    actions.writeInstanceDescriptor()

    const signals = ['exit', 'SIGINT', 'SIGTERM']
    const countAfterFirst = spy.mock.calls.filter((c) => signals.includes(c[0] as string)).length

    expect(countAfterFirst).toBe(3)

    // Second call must not re-register any of them.
    stubPid(101011)
    actions.writeInstanceDescriptor()

    const countAfterSecond = spy.mock.calls.filter((c) => signals.includes(c[0] as string)).length

    expect(countAfterSecond).toBe(countAfterFirst)

    spy.mockRestore()
  })

  it('projectHash is md5(projectRoot) when project set, null otherwise', () => {
    stubPid(121212)
    const projectRoot = '/home/me/hashed'
    const ctxA = buildCtx(projectRoot)

    new ServersActions(ctxA).writeInstanceDescriptor()

    const withProject = JSON.parse(fs.readFileSync(path.join(runningPath, '121212.json'), 'utf8'))
    const expectedHash = crypto.createHash('md5').update(projectRoot).digest('hex')

    expect(withProject.projectHash).toBe(expectedHash)
    expect(withProject.projectRoot).toBe(projectRoot)

    stubPid(131313)
    const ctxB = buildCtx(null)

    new ServersActions(ctxB).writeInstanceDescriptor()

    const withoutProject = JSON.parse(fs.readFileSync(path.join(runningPath, '131313.json'), 'utf8'))

    expect(withoutProject.projectHash).toBeNull()
    expect(withoutProject.projectRoot).toBeNull()
  })

  it('multiple writes from different pids produce separate files', () => {
    stubPid(141414)
    const ctxA = buildCtx('/home/me/pid-a')

    new ServersActions(ctxA).writeInstanceDescriptor()

    stubPid(151515)
    const ctxB = buildCtx('/home/me/pid-b')

    new ServersActions(ctxB).writeInstanceDescriptor()

    expect(fs.existsSync(path.join(runningPath, '141414.json'))).toBe(true)
    expect(fs.existsSync(path.join(runningPath, '151515.json'))).toBe(true)

    const a = JSON.parse(fs.readFileSync(path.join(runningPath, '141414.json'), 'utf8'))
    const b = JSON.parse(fs.readFileSync(path.join(runningPath, '151515.json'), 'utf8'))

    expect(a.pid).toBe(141414)
    expect(b.pid).toBe(151515)
    expect(a.token).not.toBe(b.token)
  })
})
