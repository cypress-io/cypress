import os from 'os'
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import util from '../../../lib/util'
import { start as verifyStart } from '../../../lib/tasks/verify'
import { start as spawnStart } from '../../../lib/exec/spawn'
import open from '../../../lib/exec/open'
import logger from '../../../lib/logger'

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error - importActual returns unknown, so .default is untyped
      ...actual.default,
      isInstalledGlobally: vi.fn(),
    },
  }
})

vi.mock('../../../lib/exec/spawn', async () => {
  return {
    start: vi.fn(),
  }
})

vi.mock('../../../lib/tasks/verify', () => {
  return {
    start: vi.fn(),
  }
})

describe('exec open', function () {
  describe('.start', function () {
    beforeEach(function (): void {
      vi.clearAllMocks()
      vi.unstubAllEnvs()

      vi.mocked(util.isInstalledGlobally).mockReturnValue(true)
      vi.mocked(verifyStart).mockResolvedValue(undefined)
      vi.mocked(spawnStart).mockResolvedValue(undefined)
    })

    it('verifies download', async () => {
      await open.start()
      expect(verifyStart).toHaveBeenCalled()
    })

    it('calls spawn with correct options', async () => {
      await open.start({ dev: true })
      expect(spawnStart).toHaveBeenCalledWith([], {
        detached: false,
        dev: true,
      })
    })

    it('calls spawn with detached when detached option is set', async () => {
      await open.start({ detached: true })

      expect(spawnStart).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ detached: true }),
      )
    })

    describe('ELECTRON_RUN_AS_NODE', () => {
      beforeEach(() => {
        vi.spyOn(logger, 'warn').mockImplementation(() => {})
      })

      afterEach(() => {
        vi.mocked(os.platform).mockRestore?.()
      })

      it('is dropped from the child env with a single warning', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')
        vi.stubEnv('KEEP_ME', 'yes')

        await open.start()

        const spawnOptions = vi.mocked(spawnStart).mock.calls[0][1] as { env: NodeJS.ProcessEnv }

        expect(spawnOptions.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE')
        expect(spawnOptions.env.KEEP_ME).toBe('yes')
        expect(process.env.ELECTRON_RUN_AS_NODE).toBe('1')
        expect(logger.warn).toHaveBeenCalledOnce()
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('ELECTRON_RUN_AS_NODE'))
      })

      it('is dropped when it is set to an empty string', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', '')

        await open.start()

        const spawnOptions = vi.mocked(spawnStart).mock.calls[0][1] as { env: NodeJS.ProcessEnv }

        expect(spawnOptions.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE')
        expect(logger.warn).toHaveBeenCalledOnce()
      })

      it('is dropped under any capitalization of its name on Windows', async () => {
        vi.spyOn(os, 'platform').mockReturnValue('win32')
        vi.stubEnv('Electron_Run_As_Node', '1')

        await open.start()

        const spawnOptions = vi.mocked(spawnStart).mock.calls[0][1] as { env: NodeJS.ProcessEnv }

        expect(Object.keys(spawnOptions.env).map((key) => key.toUpperCase())).not.toContain('ELECTRON_RUN_AS_NODE')
      })

      it('is not matched by a differently capitalized name where names are case-sensitive', async () => {
        vi.spyOn(os, 'platform').mockReturnValue('linux')
        vi.stubEnv('Electron_Run_As_Node', '1')

        await open.start()

        expect(logger.warn).not.toHaveBeenCalled()
      })

      it('is dropped from the environment of the smoke test that verifies the binary too', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')
        vi.stubEnv('KEEP_ME', 'yes')

        await open.start()

        const verifyOptions = vi.mocked(verifyStart).mock.calls[0][0] as { env: NodeJS.ProcessEnv }

        expect(verifyOptions.env).not.toHaveProperty('ELECTRON_RUN_AS_NODE')
        expect(verifyOptions.env.KEEP_ME).toBe('yes')
      })

      it('leaves the smoke test environment alone when unset', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', undefined)

        await open.start()

        expect(verifyStart).toHaveBeenCalledWith({ env: undefined })
      })

      it('is kept with --dev', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', '1')

        await open.start({ dev: true })

        expect(spawnStart).toHaveBeenCalledWith([], { detached: false, dev: true })
        expect(logger.warn).not.toHaveBeenCalled()
      })

      it('does not warn or override env when unset', async () => {
        vi.stubEnv('ELECTRON_RUN_AS_NODE', undefined)

        await open.start()

        expect(vi.mocked(spawnStart).mock.calls[0][1]).not.toHaveProperty('env')
        expect(logger.warn).not.toHaveBeenCalled()
      })
    })

    it('spawns with port', async () => {
      await open.start({ port: '1234' })
      expect(spawnStart).toHaveBeenCalledWith(['--port', '1234'], expect.anything())
    })

    it('spawns with --env', async () => {
      await open.start({ env: 'host=http://localhost:1337,name=brian' })
      expect(spawnStart).toHaveBeenCalledWith(
        ['--env', 'host=http://localhost:1337,name=brian'],
        expect.anything(),
      )
    })

    it('spawns with --config', async () => {
      await open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      expect(spawnStart).toHaveBeenCalledWith(
        ['--config', 'watchForFileChanges=false,baseUrl=localhost'],
        expect.anything(),
      )
    })

    it('spawns with --config-file set', async () => {
      await open.start({ configFile: 'special-cypress.config.js' })
      expect(spawnStart).toHaveBeenCalledWith(
        ['--config-file', 'special-cypress.config.js'],
        expect.anything(),
      )
    })

    it('spawns with cwd as --project if not installed globally', async () => {
      vi.mocked(util.isInstalledGlobally).mockReturnValue(false)

      await open.start()
      expect(spawnStart).toHaveBeenCalledWith(['--project', process.cwd()], expect.anything())
    })

    it('spawns without --project if not installed globally and passing --global option', async () => {
      vi.mocked(util.isInstalledGlobally).mockReturnValue(false)

      await open.start({ global: true })
      expect(spawnStart).not.toHaveBeenCalledWith(
        ['--project', process.cwd()],
      )
    })

    it('spawns with --project passed in as options even when not installed globally', async () => {
      vi.mocked(util.isInstalledGlobally).mockReturnValue(false)

      await open.start({ project: '/path/to/project' })
      expect(spawnStart).toHaveBeenCalledWith(
        ['--project', '/path/to/project'],
        expect.anything(),
      )
    })

    it('spawns with --project if specified and installed globally', async () => {
      await open.start({ project: '/path/to/project' })
      expect(spawnStart).toHaveBeenCalledWith(
        ['--project', '/path/to/project'],
        expect.anything(),
      )
    })

    it('spawns without --project if not specified and installed globally', async () => {
      await open.start()
      expect(spawnStart).toHaveBeenCalledWith([], expect.anything())
    })

    it('spawns without --testing-type when not specified', async () => {
      await open.start()
      expect(spawnStart).toHaveBeenCalledWith([], expect.anything())
    })

    it('spawns with --testing-type e2e', async () => {
      await open.start({ testingType: 'e2e' })
      expect(spawnStart).toHaveBeenCalledWith(['--testing-type', 'e2e'], expect.anything())
    })

    it('spawns with --testing-type component', async () => {
      await open.start({ testingType: 'component' })
      expect(spawnStart).toHaveBeenCalledWith(['--testing-type', 'component'], expect.anything())
    })

    it('throws if --testing-type is invalid', () => {
      expect(() => open.processOpenOptions({ testingType: 'randomTestingType' })).toThrow()
    })

    it('throws if --config-file is false', () => {
      expect(() => open.processOpenOptions({ configFile: 'false' })).toThrow()
    })
  })
})
