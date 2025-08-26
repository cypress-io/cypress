import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import { Console } from 'console'

import util from '../../../lib/util'
import state from '../../../lib/tasks/state'
import info from '../../../lib/exec/info'
import spawn from '../../../lib/exec/spawn'

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      totalmem: vi.fn(),
      freemem: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/spawn', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/info', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      findProxyEnvironmentVariables: vi.fn(),
      findCypressEnvironmentVariables: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getApplicationDataFolder: vi.fn(),
      pkgBuildInfo: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getCacheDir: vi.fn(),
    },
  }
})

describe('exec info', () => {
  const createStdoutCapture = () => {
    const logs: string[] = []
    // eslint-disable-next-line no-console
    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array<ArrayBufferLike>) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }

  // Direct console to process.stdout/stderr
  let originalConsole: Console

  beforeEach(() => {
    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
  })

  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()

    // common stubs
    // @ts-expect-error - mockImplementation
    spawn.start.mockResolvedValue(null)
    // @ts-expect-error - mockImplementation
    os.platform.mockReturnValue('linux')
    // @ts-expect-error - mockImplementation
    os.totalmem.mockReturnValue(1.2e+9)
    // @ts-expect-error - mockImplementation
    os.freemem.mockReturnValue(4e+8)

    info.findProxyEnvironmentVariables.mockReturnValue({})
    info.findCypressEnvironmentVariables.mockReturnValue({})

    // @ts-expect-error - mockImplementation
    util.getApplicationDataFolder.mockImplementation((args) => {
      if (args === 'browsers') {
        return '/user/app/data/path/to/browsers'
      }

      return '/user/app/data/path'
    })

    // @ts-expect-error - mockImplementation
    util.pkgBuildInfo.mockReturnValue({
      stable: true,
    })

    // @ts-expect-error - mockImplementation
    state.getCacheDir.mockReturnValue('/user/path/to/binary/cache')
  })

  it('prints collected info without env vars', async () => {
    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress info without browsers or vars')

    expect(spawn.start).toBeCalledWith(['--mode=info'], { dev: undefined })
  })

  it('prints proxy and cypress env vars', async () => {
    info.findProxyEnvironmentVariables.mockReturnValue({
      PROXY_ENV_VAR1: 'some proxy variable',
      PROXY_ENV_VAR2: 'another proxy variable',
    })

    info.findCypressEnvironmentVariables.mockReturnValue({
      CYPRESS_ENV_VAR1: 'my Cypress variable',
      CYPRESS_ENV_VAR2: 'my other Cypress variable',
    })

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress info with proxy and vars')
  })

  it('redacts sensitive cypress variables', async () => {
    info.findCypressEnvironmentVariables.mockReturnValue({
      CYPRESS_ENV_VAR1: 'my Cypress variable',
      CYPRESS_ENV_VAR2: 'my other Cypress variable',
      CYPRESS_PROJECT_ID: 'abc123', // not sensitive
      CYPRESS_RECORD_KEY: 'really really secret stuff', // should not be printed
    })

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress redacts sensitive vars')
  })

  it('logs additional info about pre-releases', async () => {
    // @ts-expect-error - mockImplementation
    util.pkgBuildInfo.mockReturnValue({
      stable: false,
      commitSha: 'abc123',
      commitBranch: 'someBranchName',
      commitDate: new Date('2022-02-02').toISOString(),
    })

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('logs additional info about pre-releases')
  })

  it('logs if unbuilt development', async () => {
    // @ts-expect-error - mockImplementation
    util.pkgBuildInfo.mockReturnValue(undefined)

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('logs additional info about development')
  })
})
