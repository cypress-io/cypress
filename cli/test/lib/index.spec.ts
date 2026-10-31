import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

const loaded = vi.hoisted(() => {
  return {
    cypress: false,
    util: false,
    install: false,
    verify: false,
    installStart: vi.fn(),
    verifyStart: vi.fn(),
    logErrorExit1: vi.fn(),
  }
})

vi.mock('../../lib/cypress', () => {
  loaded.cypress = true

  return {}
})

vi.mock('../../lib/util', () => {
  loaded.util = true

  return { default: { logErrorExit1: loaded.logErrorExit1 } }
})

vi.mock('../../lib/tasks/install', () => {
  loaded.install = true

  return { default: { start: loaded.installStart } }
})

vi.mock('../../lib/tasks/verify', () => {
  loaded.verify = true

  return { start: loaded.verifyStart }
})

describe('index', function () {
  const originalArgv = process.argv

  beforeEach(function () {
    vi.resetModules()
    vi.clearAllMocks()
    loaded.cypress = false
    loaded.util = false
    loaded.install = false
    loaded.verify = false
  })

  afterEach(function () {
    process.argv = originalArgv
  })

  it('exports the Module API without loading the rest of the CLI', async () => {
    process.argv = ['node', 'index.js']

    const index = await import('../../lib/index.js')

    expect(index.defineConfig({ e2e: {} })).toEqual({ e2e: {} })
    expect(Object.keys(index.default).sort()).toEqual(['cli', 'defineComponentFramework', 'defineConfig', 'open', 'run'])
    expect(loaded).toMatchObject({ cypress: false, util: false, install: false, verify: false })
  })

  it('runs the install task for --exec install', async () => {
    process.argv = ['node', 'index.js', '--exec', 'install', '--force']
    loaded.installStart.mockResolvedValue(undefined)

    await import('../../lib/index.js')

    await vi.waitFor(() => expect(loaded.installStart).toHaveBeenCalledWith({ force: true }))
    expect(loaded.verify).toBe(false)
  })

  it('runs a forced verify for --exec verify', async () => {
    process.argv = ['node', 'index.js', '--exec', 'verify']
    loaded.verifyStart.mockResolvedValue(undefined)

    await import('../../lib/index.js')

    await vi.waitFor(() => expect(loaded.verifyStart).toHaveBeenCalledWith({ force: true }))
    expect(loaded.install).toBe(false)
  })

  it('reports a failed task through util.logErrorExit1', async () => {
    const err = new Error('download failed')

    process.argv = ['node', 'index.js', '--exec', 'install']
    loaded.installStart.mockRejectedValue(err)

    await import('../../lib/index.js')

    await vi.waitFor(() => expect(loaded.logErrorExit1).toHaveBeenCalledWith(err))
  })
})
