import { describe, it, expect, vi, Mocked } from 'vitest'
import type { FoundBrowser } from '@packages/types'
import { launch } from '../../lib/launch'
import os from 'os'
import { spawn, ChildProcess } from 'child_process'
import EventEmitter from 'events'

vi.mock('os', async (importActual) => {
  const actual: typeof os = await importActual()

  return {
    default: {
      ...actual,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('child_process', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    spawn: vi.fn(),
  }
})

describe('launch', () => {
  let browser: FoundBrowser
  let url: string
  let args: string[]
  let browserEnv: Record<string, string>
  let launchedBrowser: Mocked<ChildProcess>

  let arch: ReturnType<typeof os.arch>
  let platform: ReturnType<typeof os.platform>

  beforeEach(() => {
    browser = {
      name: 'chrome',
      version: '100.0.0',
      path: 'chrome',
      family: 'chromium',
      channel: 'stable',
      displayName: 'Chrome',
    }

    url = 'https://www.somedomain.test'
    args = ['--headless']
    browserEnv = {}

    launchedBrowser = {
      on: vi.fn() as any,
      // these are streams, but we don't need to test
      // stream logic - they do need to implement event
      // emission though, because of addDebugListeners
      // @ts-expect-error
      stdout: new EventEmitter(),
      // @ts-expect-error
      stderr: new EventEmitter(),
      kill: vi.fn(),
    }

    vi.mocked(os.arch).mockImplementation(() => arch)
    vi.mocked(os.platform).mockImplementation(() => platform)

    vi.mocked(spawn).mockReturnValue(launchedBrowser)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('throws when browser.path is missing', () => {
    browser.path = undefined

    expect(() => launch(browser, url, args, browserEnv)).toThrow('Browser chrome is missing path')
  })

  describe('when darwin arm64', () => {
    beforeEach(() => {
      arch = 'arm64'
      platform = 'darwin'
    })

    it('launches a browser', () => {
      const proc = launch(browser, url, args, browserEnv)

      expect(spawn).toHaveBeenCalledWith(
        'arch',
        [browser.path, url, ...args],
        expect.objectContaining({
          stdio: ['ignore', 'pipe', 'pipe'],
          env: expect.objectContaining({
            ...browserEnv,
            ARCHPREFERENCE: 'arm64,x86_64',
          }),
        }),
      )

      expect(proc).toBe(launchedBrowser)
    })
  })

  for (const [testArch, testPlatform] of [
    ['x64', 'darwin'],
    ['x64', 'linux'],
    ['arm64', 'linux'],
    ['x64', 'win32'],
    ['arm64', 'win32'],
  ]) {
    describe(`when ${testPlatform} ${testArch}`, () => {
      beforeEach(() => {
        arch = testArch as typeof arch
        platform = testPlatform as typeof platform
      })

      it('launches a browser', () => {
        const proc = launch(browser, url, args, browserEnv)

        expect(spawn).toHaveBeenCalledWith(
          browser.path,
          [url, ...args],
          expect.objectContaining({
            stdio: ['ignore', 'pipe', 'pipe'],
            env: expect.any(Object),
          }),
        )

        expect(proc).toBe(launchedBrowser)
      })
    })
  }
})
