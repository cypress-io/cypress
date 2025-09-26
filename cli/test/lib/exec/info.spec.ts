import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import chalk from 'chalk'
import { Console } from 'console'
import si, { Systeminformation } from 'systeminformation'
import util from '../../../lib/util'
import state from '../../../lib/tasks/state'
import info from '../../../lib/exec/info'
import { start as spawnStart } from '../../../lib/exec/spawn'

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

vi.mock('systeminformation', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/spawn', async () => {
  return {
    start: vi.fn(),
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

  let previousChalkLevel: 0 | 1 | 2 | 3

  beforeEach(() => {
    previousChalkLevel = chalk.level
    chalk.level = 3

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)

    vi.unstubAllEnvs()
    vi.resetAllMocks()

    vi.stubEnv('NO_PROXY', undefined)
    vi.stubEnv('CYPRESS_COMMERCIAL_RECOMMENDATIONS', undefined)
    // common stubs
    vi.mocked(spawnStart).mockResolvedValue(null)
    vi.mocked(os.platform).mockReturnValue('linux')
    vi.mocked(os.totalmem).mockReturnValue(1.2e+9)
    vi.mocked(os.freemem).mockReturnValue(4e+8)

    vi.mocked(util.getApplicationDataFolder).mockImplementation((args) => {
      if (args === 'browsers') {
        return '/user/app/data/path/to/browsers'
      }

      return '/user/app/data/path'
    })

    vi.mocked(util.pkgBuildInfo).mockReturnValue({
      stable: true,
    })

    vi.mocked(state.getCacheDir).mockReturnValue('/user/path/to/binary/cache')

    vi.mocked(si.osInfo).mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    } as Systeminformation.OsData)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
    chalk.level = previousChalkLevel
  })

  it('prints collected info without env vars', async () => {
    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress info without browsers or vars')

    expect(spawnStart).toBeCalledWith(['--mode=info'], { dev: undefined })
  })

  it('prints proxy and cypress env vars', async () => {
    vi.stubEnv('HTTP_PROXY', 'some proxy variable')
    vi.stubEnv('HTTPS_PROXY', 'another proxy variable')
    vi.stubEnv('NO_PROXY', 'no proxy variable')

    vi.stubEnv('CYPRESS_ENV_VAR1', 'my Cypress variable')
    vi.stubEnv('CYPRESS_ENV_VAR2', 'my other Cypress variable')

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress info with proxy and vars')
  })

  it('redacts sensitive cypress variables', async () => {
    vi.stubEnv('CYPRESS_ENV_VAR1', 'my Cypress variable')
    vi.stubEnv('CYPRESS_ENV_VAR2', 'my other Cypress variable')
    vi.stubEnv('CYPRESS_PROJECT_ID', 'abc123') // not sensitive
    vi.stubEnv('CYPRESS_RECORD_KEY', 'really really secret stuff') // should not be printed

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('cypress redacts sensitive vars')
  })

  it('logs additional info about pre-releases', async () => {
    vi.mocked(util.pkgBuildInfo).mockReturnValue({
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
    vi.mocked(util.pkgBuildInfo).mockReturnValue(undefined)

    const output = createStdoutCapture()

    await info.start()

    expect(output()).toMatchSnapshot('logs additional info about development')
  })
})
