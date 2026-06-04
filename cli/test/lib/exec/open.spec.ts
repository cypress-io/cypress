import { vi, describe, it, beforeEach, expect } from 'vitest'
import util from '../../../lib/util'
import { start as verifyStart } from '../../../lib/tasks/verify'
import { start as spawnStart } from '../../../lib/exec/spawn'
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
