import { vi, describe, it, beforeEach, expect } from 'vitest'
import os from 'os'
import util from '../../../lib/util'
import run from '../../../lib/exec/run'
import { start as spawnStart } from '../../../lib/exec/spawn'
import { start as verifyStart } from '../../../lib/tasks/verify'

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

describe('exec run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()

    vi.mocked(util.isInstalledGlobally).mockReturnValue(true)
  })

  describe('.processRunOptions', () => {
    it('allows string --project option', () => {
      const args = run.processRunOptions({
        project: '/path/to/project',
      })

      expect(args).toEqual(['--run-project', '/path/to/project'])
    })

    it('throws an error for empty string --project', () => {
      expect(() => run.processRunOptions({ project: '' })).toThrow()
    })

    it('throws an error for boolean --project', () => {
      expect(() => run.processRunOptions({ project: false })).toThrow()
      expect(() => run.processRunOptions({ project: true })).toThrow()
    })

    it('throws an error for --project "false" or "true"', () => {
      expect(() => run.processRunOptions({ project: 'false' })).toThrow()
      expect(() => run.processRunOptions({ project: 'true' })).toThrow()
    })

    it('passes --browser option', () => {
      const args = run.processRunOptions({
        browser: 'test browser',
      })

      expect(args).toMatchSnapshot()
    })

    it('passes --record option', () => {
      const args = run.processRunOptions({
        record: 'my record id',
      })

      expect(args).toMatchSnapshot()
    })

    it('does not allow setting paradoxical --headed and --headless flags', () => {
      vi.mocked(os.platform).mockReturnValue('linux')

      expect(() => run.processRunOptions({ headed: true, headless: true })).toThrow()
    })

    it('passes --headed according to --headless', () => {
      expect(run.processRunOptions({ headless: true })).toEqual([
        '--run-project', undefined, '--headed', 'false',
      ])
    })

    it('does not remove --record option when using --browser', () => {
      const args = run.processRunOptions({
        record: 'foo',
        browser: 'test browser',
      })

      expect(args).toMatchSnapshot()
    })

    it('defaults to e2e testingType', () => {
      const args = run.processRunOptions()

      expect(args).toMatchSnapshot()
    })

    it('passes e2e testingType', () => {
      expect(run.processRunOptions({ testingType: 'e2e' })).toEqual([
        '--run-project', undefined, '--testing-type', 'e2e',
      ])
    })

    it('passes component testingType', () => {
      expect(run.processRunOptions({ testingType: 'component' })).toEqual([
        '--run-project', undefined, '--testing-type', 'component',
      ])
    })

    it('throws if testingType is invalid', () => {
      expect(() => run.processRunOptions({ testingType: 'randomTestingType' })).toThrow()
    })

    it('throws if both e2e and component are set', () => {
      expect(() => run.processRunOptions({ e2e: true, component: true })).toThrow()
    })

    it('throws if both testingType and component are set', () => {
      expect(() => run.processRunOptions({ testingType: 'component', component: true })).toThrow()
    })

    it('throws if --config-file is false', () => {
      expect(() => run.processRunOptions({ configFile: 'false' })).toThrow()
    })
  })

  describe('.start', () => {
    beforeEach(() => {
      vi.mocked(spawnStart).mockResolvedValue(undefined)
      vi.mocked(verifyStart).mockResolvedValue(undefined)
    })

    it('verifies cypress', async () => {
      await run.start()
      expect(verifyStart).toHaveBeenCalledOnce()
    })

    it('spawns with --key and xvfb', async () => {
      await run.start({ port: '1234' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--port', '1234'], expect.anything())
    })

    it('spawns with --env', async () => {
      await run.start({ env: 'host=http://localhost:1337,name=brian' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--env', 'host=http://localhost:1337,name=brian'], expect.anything())
    })

    it('spawns with --config', async () => {
      await run.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--config', 'watchForFileChanges=false,baseUrl=localhost'], expect.anything())
    })

    it('spawns with --config-file set', async () => {
      await run.start({ configFile: 'special-cypress.config.js' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--config-file', 'special-cypress.config.js'], expect.anything())
    })

    it('spawns with --record false', async () => {
      await run.start({ record: false })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--record', false], expect.anything())
    })

    it('spawns with --headed true', async () => {
      await run.start({ headed: true })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--headed', true], expect.anything())
    })

    it('spawns with --no-exit', async () => {
      await run.start({ exit: false })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--no-exit'], expect.anything())
    })

    it('spawns with --output-path', async () => {
      await run.start({ outputPath: '/path/to/output' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--output-path', '/path/to/output'], expect.anything())
    })

    it('spawns with --testing-type e2e when given --e2e', async () => {
      await run.start({ e2e: true })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--testing-type', 'e2e'], expect.anything())
    })

    it('spawns with --testing-type component when given --component', async () => {
      await run.start({ component: true })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--testing-type', 'component'], expect.anything())
    })

    it('spawns with --tag value', async () => {
      await run.start({ tag: 'nightly' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--tag', 'nightly'], expect.anything())
    })

    it('spawns with several --tag words unchanged', async () => {
      await run.start({ tag: 'nightly, sanity' })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--tag', 'nightly, sanity'], expect.anything())
    })

    it('spawns with --auto-cancel-after-failures value', async () => {
      await run.start({ autoCancelAfterFailures: 4 })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--auto-cancel-after-failures', 4], expect.anything())
    })

    it('spawns with --auto-cancel-after-failures value false', async () => {
      await run.start({ autoCancelAfterFailures: false })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--auto-cancel-after-failures', false], expect.anything())
    })

    it('spawns with --runner-ui', async () => {
      await run.start({ runnerUi: true })
      expect(spawnStart).toHaveBeenCalledWith(['--run-project', process.cwd(), '--runner-ui', true], expect.anything())
    })
  })
})
