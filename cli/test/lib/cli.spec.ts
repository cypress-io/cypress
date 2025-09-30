import { vi, describe, it, beforeEach, expect } from 'vitest'
import os from 'os'
import Debug from 'debug'
import execa from 'execa-wrap'
import cli from '../../lib/cli'
import util from '../../lib/util'
import logger from '../../lib/logger'
import info from '../../lib/exec/info'
import run from '../../lib/exec/run'
import open from '../../lib/exec/open'
import cache from '../../lib/tasks/cache'
import state from '../../lib/tasks/state'
import { start as verifyStart } from '../../lib/tasks/verify'
import install from '../../lib/tasks/install'

const debug = Debug('test')

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
    },
  }
})

vi.mock('../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      logErrorExit1: vi.fn(),
      pkgBuildInfo: vi.fn(),
      pkgVersion: vi.fn(),
    },
  }
})

vi.mock('../../lib/exec/run', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../lib/exec/open', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../lib/exec/info', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../lib/tasks/install', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      start: vi.fn(),
    },
  }
})

vi.mock('../../lib/tasks/verify', () => {
  return {
    start: vi.fn(),
  }
})

vi.mock('../../lib/tasks/cache', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      list: vi.fn(),
    },
  }
})

vi.mock('../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getBinaryDir: vi.fn(),
      getBinaryPkgAsync: vi.fn(),
    },
  }
})

const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 250)
  })
}

describe('cli', () => {
  const binaryDir = '/binary/dir'
  let exec: (args: string) => Promise<any>
  let processExitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()

    logger.reset()

    processExitSpy = vi.spyOn(process, 'exit').mockReturnValue(null as never)
    vi.mocked(os.platform).mockReturnValue('darwin')
    vi.mocked(util.logErrorExit1).mockReturnValue(null as never)
    vi.mocked(util.pkgBuildInfo).mockReturnValue({ stable: true } as any)
    vi.mocked(util.pkgVersion).mockReturnValue('1.2.3')
    vi.mocked(state.getBinaryDir).mockReturnValue(binaryDir)
    // @ts-expect-error - mock args
    vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
      if (args === binaryDir) {
        return {
          version: 'X.Y.Z',
          electronVersion: '10.9.8',
          electronNodeVersion: '7.7.7',
        }
      }

      throw new Error('not found')
    })

    exec = (args: string): any => {
      const cliArgs = `node test ${args}`.split(' ')

      debug('calling cli.init with: %o', cliArgs)

      return cli.init(cliArgs)
    }
  })

  describe('unknown option', () => {
    // note it shows help for that specific command
    it('shows help', async () => {
      const result = await execa('bin/cypress', ['open', '--foo'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for run command', async () => {
      const result = await execa('bin/cypress', ['run', '--foo'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for cache command - unknown option --foo', async () => {
      const result = await execa('bin/cypress', ['cache', '--foo'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for cache command - unknown sub-command foo', async () => {
      const result = await execa('bin/cypress', ['cache', 'foo'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for cache command - no sub-command', async () => {
      const result = await execa('bin/cypress', ['cache'])

      expect(result).toMatchSnapshot()
    })
  })

  describe('help command', () => {
    it('shows help', async () => {
      const result = await execa('bin/cypress', ['help'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for -h', async () => {
      const result = await execa('bin/cypress', ['-h'])

      expect(result).toMatchSnapshot()
    })

    it('shows help for --help', async () => {
      const result = await execa('bin/cypress', ['--help'])

      expect(result).toMatchSnapshot()
    })
  })

  describe('unknown command', () => {
    it('shows usage and exits', async () => {
      const result = await execa('bin/cypress', ['foo'])

      expect(result).toMatchSnapshot()
    })
  })

  describe('CYPRESS_INTERNAL_ENV', () => {
    /**
     * Replaces line "Platform: ..." with "Platform: xxx"
     * @param {string} s
     */
    const replacePlatform = (s: string): string => {
      return s.replace(/Platform: .+/, 'Platform: xxx')
    }

    /**
     * Replaces line "Cypress Version: ..." with "Cypress Version: 1.2.3"
     * @param {string} s
     */
    const replaceCypressVersion = (s: string): string => {
      return s.replace(/Cypress Version: .+/, 'Cypress Version: 1.2.3')
    }

    const sanitizePlatform = (text: any): any => {
      return text
      // @ts-expect-error
      .split(os.eol)
      .map(replacePlatform)
      .map(replaceCypressVersion)
      // @ts-expect-error
      .join(os.eol)
    }

    it('allows and warns when staging environment', async () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'staging',
        },
        filter: ['code', 'stderr', 'stdout'],
      }

      const result = await execa('bin/cypress', ['help'], options)

      expect(result).toMatchSnapshot()
    })

    it('catches environment "foo"', async () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'foo',
        },
        // we are only interested in the exit code
        filter: ['code', 'stderr'],
      }

      const result = await execa('bin/cypress', ['help'], options)

      expect(sanitizePlatform(result)).toMatchSnapshot()
    })
  })

  const versionCommands = ['--version', '-v', 'version']

  versionCommands.forEach((versionCommand: string) => {
    describe(`cypress ${versionCommand}`, () => {
      describe('individual package versions', () => {
        it('reports just the package version', async () => {
          await exec(`${versionCommand} --component package`)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toEqual('1.2.3')
        })

        it('reports just the binary version', async () => {
          await exec(`${versionCommand} --component binary`)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toEqual('X.Y.Z')
        })

        it('reports just the electron version', async () => {
          await exec(`${versionCommand} --component electron`)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toEqual('10.9.8')
        })

        it('reports just the bundled Node version', async () => {
          await exec(`${versionCommand} --component node`)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toEqual('7.7.7')
        })

        it('handles not found bundled Node version', async () => {
          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
                electronVersion: '10.9.8',
              })
            }

            throw new Error('not found')
          })

          await exec(`${versionCommand} --component node`)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toEqual('not found')
        })

        it('reports package version', async () => {
          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
              })
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })

        it('reports package and binary message', async () => {
          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
              })
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })

        it('reports electron and node message', async () => {
          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
                electronVersion: '10.10.88',
                electronNodeVersion: '11.10.3',
              })
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })

        it('reports package and binary message with npm log silent', async () => {
          vi.stubEnv('npm_config_loglevel', 'silent')

          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
              })
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })

        it('reports package and binary message with npm log warn', async () => {
          vi.stubEnv('npm_config_loglevel', 'warn')

          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve({
                version: 'X.Y.Z',
              })
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })

        it('handles non-existent binary', async () => {
          vi.mocked(state.getBinaryPkgAsync).mockImplementation((args: string) => {
            if (args === binaryDir) {
              return Promise.resolve(null)
            }

            throw new Error('not found')
          })

          await exec(versionCommand)

          await flushPromises()

          expect(processExitSpy).toHaveBeenCalledWith(0)
          expect(logger.print()).toMatchSnapshot()
        })
      })
    })
  })

  describe('cypress run', () => {
    beforeEach(() => {
      vi.mocked(run.start).mockResolvedValue(0)
    })

    it('calls run.start with options + exits with code', async () => {
      vi.mocked(run.start).mockResolvedValue(10)

      await exec('run')
      await flushPromises()

      expect(processExitSpy).toHaveBeenCalledWith(10)
    })

    it('run.start with options + catches errors', async () => {
      const err = new Error('foo')

      vi.mocked(run.start).mockRejectedValue(err)

      await exec('run')
      await flushPromises()

      expect(util.logErrorExit1).toHaveBeenCalledWith(err)
    })

    it('calls run with port', async () => {
      await exec('run --port 7878')
      expect(run.start).toBeCalledWith({ port: '7878' })
    })

    it('calls run with port with -p arg', async () => {
      await exec('run -p 8989')
      expect(run.start).toBeCalledWith({ port: '8989' })
    })

    it('calls run with env variables', async () => {
      await exec('run --env foo=bar,host=http://localhost:8888')
      expect(run.start).toBeCalledWith({
        env: 'foo=bar,host=http://localhost:8888',
      })
    })

    it('calls run with config', async () => {
      await exec('run --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).toBeCalledWith({
        config: 'watchForFileChanges=false,baseUrl=localhost',
      })
    })

    it('calls run with key', async () => {
      await exec('run --key asdf')
      expect(run.start).toBeCalledWith({ key: 'asdf' })
    })

    it('calls run with --record', async () => {
      await exec('run --record')
      expect(run.start).toBeCalledWith({ record: true })
    })

    it('calls run with --record false', async () => {
      await exec('run --record false')
      expect(run.start).toBeCalledWith({ record: false })
    })

    it('calls run with relative --project folder', async () => {
      await exec('run --project foo/bar')
      expect(run.start).toBeCalledWith({ project: 'foo/bar' })
    })

    it('calls run with absolute --project folder', async () => {
      await exec('run --project /tmp/foo/bar')
      expect(run.start).toBeCalledWith({ project: '/tmp/foo/bar' })
    })

    it('calls run with headed', async () => {
      await exec('run --headed')
      expect(run.start).toBeCalledWith({ headed: true })
    })

    it('calls run with --no-exit', async () => {
      await exec('run --no-exit')
      expect(run.start).toBeCalledWith({ exit: false })
    })

    it('calls run with --parallel', async () => {
      await exec('run --parallel')
      expect(run.start).toBeCalledWith({ parallel: true })
    })

    it('calls run with --ci-build-id', async () => {
      await exec('run --ci-build-id 123')
      expect(run.start).toBeCalledWith({ ciBuildId: '123' })
    })

    it('calls run with --group', async () => {
      await exec('run --group staging')
      expect(run.start).toBeCalledWith({ group: 'staging' })
    })

    it('calls run with spec', async () => {
      await exec('run --spec cypress/integration/foo_spec.js')
      expect(run.start).toBeCalledWith({
        spec: 'cypress/integration/foo_spec.js',
      })
    })

    it('calls run with space-separated --spec', async () => {
      await exec('run --spec a b c d e f g')
      expect(run.start).toBeCalledWith({ spec: 'a,b,c,d,e,f,g' })

      await exec('run --dev bang --spec foo bar baz -P ./')
      expect(run.start).toBeCalledWith(expect.objectContaining({ spec: 'foo,bar,baz' }))
    })

    it('warns with space-separated --spec', async () => {
      await exec('run --spec a b c d e f g --dev')

      expect(logger.print()).toMatchSnapshot()
    })

    it('calls run with --tag', async () => {
      await exec('run --tag nightly')
      expect(run.start).toBeCalledWith({ tag: 'nightly' })
    })

    it('calls run comma-separated --tag', async () => {
      await exec('run --tag nightly,staging')
      expect(run.start).toBeCalledWith({ tag: 'nightly,staging' })
    })

    it('does not remove double quotes from --tag', async () => {
      // I think it is a good idea to lock down this behavior
      // to make sure we either preserve it or change it in the future
      await exec('run --tag "nightly"')
      expect(run.start).toBeCalledWith({ tag: '"nightly"' })
    })

    it('calls run comma-separated --spec', async () => {
      await exec('run --spec main_spec.js,view_spec.js')
      expect(run.start).toBeCalledWith({ spec: 'main_spec.js,view_spec.js' })
    })

    it('calls run with space-separated --tag', async () => {
      await exec('run --tag a b c d e f g')
      expect(run.start).toBeCalledWith({ tag: 'a,b,c,d,e,f,g' })

      await exec('run --dev bang --tag foo bar baz -P ./')
      expect(run.start).toBeCalledWith(expect.objectContaining({ tag: 'foo,bar,baz' }))
    })

    it('warns with space-separated --tag', async () => {
      await exec('run --tag a b c d e f g --dev')
      expect(logger.print()).toMatchSnapshot()
    })

    it('calls run with space-separated --tag and --spec', async () => {
      await exec('run --tag a b c d e f g --spec h i j k l')
      expect(run.start).toBeCalledWith({ tag: 'a,b,c,d,e,f,g', spec: 'h,i,j,k,l' })

      await exec('run --dev bang --tag foo bar baz -P ./ --spec fizz buzz --headed false')
      expect(run.start).toBeCalledWith(expect.objectContaining({ tag: 'foo,bar,baz', spec: 'fizz,buzz' }))
    })

    it('removes stray double quotes from --ci-build-id and --group', async () => {
      await exec('run --ci-build-id "123" --group "staging"')
      expect(run.start).toBeCalledWith({ ciBuildId: '123', group: 'staging' })
    })

    it('calls run with --auto-cancel-after-failures', async () => {
      await exec('run --auto-cancel-after-failures 4')
      expect(run.start).toBeCalledWith({ autoCancelAfterFailures: '4' })
    })

    it('calls run with --auto-cancel-after-failures with false', async () => {
      await exec('run --auto-cancel-after-failures false')
      expect(run.start).toBeCalledWith({ autoCancelAfterFailures: 'false' })
    })

    it('calls run with --runner-ui', async () => {
      await exec('run --runner-ui')
      expect(run.start).toBeCalledWith({ runnerUi: true })
    })

    it('calls run with --no-runner-ui', async () => {
      await exec('run --no-runner-ui')
      expect(run.start).toBeCalledWith({ runnerUi: false })
    })

    it('calls run with --posix-exit-codes', async () => {
      await exec('run --posix-exit-codes')
      expect(run.start).toBeCalledWith({ posixExitCodes: true })
    })

    describe('component-testing', () => {
      it('passes to run.start the correct args for component-testing', async () => {
        await exec('run --component --dev')

        expect(run.start).toHaveBeenNthCalledWith(1, {
          component: true,
          dev: true,
        })
      })
    })
  })

  describe('cypress open', () => {
    beforeEach(() => {
      vi.mocked(open.start).mockResolvedValue(0)
    })

    it('calls open.start with relative --project folder', async () => {
      await exec('open --project foo/bar')
      expect(open.start).toBeCalledWith({ project: 'foo/bar' })
    })

    it('calls open.start with absolute --project folder', async () => {
      await exec('open --project /tmp/foo/bar')
      expect(open.start).toBeCalledWith({ project: '/tmp/foo/bar' })
    })

    it('calls open.start with options', async () => {
      await exec('open --port 7878')
      expect(open.start).toBeCalledWith({ port: '7878' })
    })

    it('calls open.start with global', async () => {
      await exec('open --port 7878 --global')
      expect(open.start).toBeCalledWith({ port: '7878', global: true })
    })

    it('calls open.start + catches errors', async () => {
      const err = new Error('foo')

      vi.mocked(open.start).mockRejectedValue(err)

      await exec('open --port 7878')

      await flushPromises()

      expect(util.logErrorExit1).toHaveBeenCalledWith(err)
    })

    describe('component-testing', () => {
      it('passes to open.start the correct args for component-testing', async () => {
        await exec('open --component --dev')
        await flushPromises()

        expect(open.start).toHaveBeenNthCalledWith(1, {
          component: true,
          dev: true,
        })
      })
    })
  })

  describe('cypress install', () => {
    beforeEach(() => {
      vi.mocked(install.start).mockResolvedValue(undefined)
    })

    it('calls install.start without forcing', async () => {
      await exec('install')
      expect(install.start).not.toBeCalledWith({ force: true })
    })

    it('calls install.start with force: true when passed', async () => {
      await exec('install --force')
      expect(install.start).toBeCalledWith({ force: true })
    })

    it('install calls install.start + catches errors', async () => {
      const err = new Error('foo')

      vi.mocked(install.start).mockRejectedValue(err)

      await exec('install')
      await flushPromises()

      expect(util.logErrorExit1).toHaveBeenCalledWith(err)
    })
  })

  describe('cypress verify', () => {
    beforeEach(() => {
      vi.mocked(verifyStart).mockResolvedValue(undefined)
    })

    it('verify calls verifyStart with force: true', async () => {
      await exec('verify')
      expect(verifyStart).toBeCalledWith({
        force: true,
        welcomeMessage: false,
      })
    })

    it('verify calls verifyStart + catches errors', async () => {
      const err = new Error('foo')

      vi.mocked(verifyStart).mockRejectedValue(err)

      await exec('verify')
      await flushPromises()

      expect(util.logErrorExit1).toHaveBeenCalledWith(err)
    })
  })

  describe('cypress info', () => {
    beforeEach(() => {
      info.start.mockResolvedValue(undefined)
    })

    it('calls info start', async () => {
      await exec('info')
      expect(info.start).toBeCalled()
    })
  })

  describe('cypress cache list', () => {
    it('prints explanation when no cache', async () => {
      const err: any = new Error()

      err.code = 'ENOENT'

      vi.mocked(cache.list).mockRejectedValue(err)

      await exec('cache list')

      await flushPromises()

      expect(logger.print()).toMatchSnapshot()
    })

    it('catches rejection and exits', async () => {
      const err = new Error('cache list failed badly')

      vi.mocked(cache.list).mockRejectedValue(err)

      await exec('cache list')

      await flushPromises()

      expect(util.logErrorExit1).toHaveBeenCalledWith(err)
    })
  })
})
