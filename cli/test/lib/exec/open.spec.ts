import { vi, describe, it, beforeEach, expect } from 'vitest'
import util from '../../../lib/util'
import { start as verifyStart } from '../../../lib/tasks/verify'
import spawn from '../../../lib/exec/spawn'
import open from '../../../lib/exec/open'

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      isInstalledGlobally: vi.fn(),
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

      // @ts-expect-error - mockReturnValue
      util.isInstalledGlobally.mockReturnValue(true)
      // @ts-expect-error - mockResolvedValue
      verifyStart.mockResolvedValue(undefined)
      // @ts-expect-error - mockResolvedValue
      spawn.start.mockResolvedValue(undefined)
    })

    it('verifies download', async () => {
      await open.start()
      expect(verifyStart).toHaveBeenCalled()
    })

    it('calls spawn with correct options', async () => {
      await open.start({ dev: true })
      expect(spawn.start).toHaveBeenCalledWith([], {
        detached: false,
        dev: true,
      })
    })

    it('spawns with port', async () => {
      await open.start({ port: '1234' })
      expect(spawn.start).toHaveBeenCalledWith(['--port', '1234'], expect.anything())
    })

    it('spawns with --env', async () => {
      await open.start({ env: 'host=http://localhost:1337,name=brian' })
      expect(spawn.start).toHaveBeenCalledWith(
        ['--env', 'host=http://localhost:1337,name=brian'],
        expect.anything(),
      )
    })

    it('spawns with --config', async () => {
      await open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      expect(spawn.start).toHaveBeenCalledWith(
        ['--config', 'watchForFileChanges=false,baseUrl=localhost'],
        expect.anything(),
      )
    })

    it('spawns with --config-file set', async () => {
      await open.start({ configFile: 'special-cypress.config.js' })
      expect(spawn.start).toHaveBeenCalledWith(
        ['--config-file', 'special-cypress.config.js'],
        expect.anything(),
      )
    })

    it('spawns with cwd as --project if not installed globally', async () => {
      // @ts-expect-error - is shorthand stub on a function
      util.isInstalledGlobally.mockReturnValue(false)

      await open.start()
      expect(spawn.start).toHaveBeenCalledWith(['--project', process.cwd()], expect.anything())
    })

    it('spawns without --project if not installed globally and passing --global option', async () => {
      // @ts-expect-error - is shorthand stub on a function
      util.isInstalledGlobally.mockReturnValue(false)

      await open.start({ global: true })
      expect(spawn.start).not.toHaveBeenCalledWith(
        ['--project', process.cwd()],
      )
    })

    it('spawns with --project passed in as options even when not installed globally', async () => {
      // @ts-expect-error - is shorthand stub on a function
      util.isInstalledGlobally.mockReturnValue(false)

      await open.start({ project: '/path/to/project' })
      expect(spawn.start).toHaveBeenCalledWith(
        ['--project', '/path/to/project'],
        expect.anything(),
      )
    })

    it('spawns with --project if specified and installed globally', async () => {
      await open.start({ project: '/path/to/project' })
      expect(spawn.start).toHaveBeenCalledWith(
        ['--project', '/path/to/project'],
        expect.anything(),
      )
    })

    it('spawns without --project if not specified and installed globally', async () => {
      await open.start()
      expect(spawn.start).toHaveBeenCalledWith([], expect.anything())
    })

    it('spawns without --testing-type when not specified', async () => {
      await open.start()
      expect(spawn.start).toHaveBeenCalledWith([], expect.anything())
    })

    it('spawns with --testing-type e2e', async () => {
      await open.start({ testingType: 'e2e' })
      expect(spawn.start).toHaveBeenCalledWith(['--testing-type', 'e2e'], expect.anything())
    })

    it('spawns with --testing-type component', async () => {
      await open.start({ testingType: 'component' })
      expect(spawn.start).toHaveBeenCalledWith(['--testing-type', 'component'], expect.anything())
    })

    it('throws if --testing-type is invalid', () => {
      expect(() => open.processOpenOptions({ testingType: 'randomTestingType' })).toThrow()
    })

    it('throws if --config-file is false', () => {
      expect(() => open.processOpenOptions({ configFile: 'false' })).toThrow()
    })
  })
})
