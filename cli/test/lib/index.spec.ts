import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

const loaded = vi.hoisted(() => {
  return {
    cypress: false,
    util: false,
    postinstall: false,
    install: false,
    verify: false,
  }
})

vi.mock('../../lib/cypress', () => {
  loaded.cypress = true

  return {}
})

vi.mock('../../lib/util', () => {
  loaded.util = true

  return { default: {} }
})

vi.mock('../../lib/postinstall', () => {
  loaded.postinstall = true

  return {}
})

vi.mock('../../lib/tasks/install', () => {
  loaded.install = true

  return { default: {} }
})

vi.mock('../../lib/tasks/verify', () => {
  loaded.verify = true

  return {}
})

const nothingLoaded = { cypress: false, util: false, postinstall: false, install: false, verify: false }

describe('index', function () {
  const originalArgv = process.argv

  beforeEach(function () {
    vi.resetModules()
    Object.assign(loaded, nothingLoaded)
  })

  afterEach(function () {
    process.argv = originalArgv
  })

  it('exports the Module API without loading the rest of the CLI', async () => {
    const index = await import('../../lib/index.js')

    expect(index.defineConfig({ e2e: {} })).toEqual({ e2e: {} })
    expect(Object.keys(index.default).sort()).toEqual(['cli', 'defineComponentFramework', 'defineConfig', 'open', 'run'])
    expect(loaded).toEqual(nothingLoaded)
  })

  it('does not act on --exec in the arguments of the process that requires it', async () => {
    process.argv = ['node', 'some-tool.js', '--exec', 'install']

    await import('../../lib/index.js')
    // let any deferred import settle before checking
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(loaded).toEqual(nothingLoaded)
  })
})
