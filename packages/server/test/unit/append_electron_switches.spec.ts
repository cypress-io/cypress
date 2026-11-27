import os from 'os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendElectronSwitches } from '../../lib/append_electron_switches'
import { DEFAULT_ELECTRON_FLAGS } from '../../lib/util/chromium_flags'

describe('lib/append_electron_switches', () => {
  beforeEach(() => {
    vi.spyOn(os, 'platform').mockReturnValue('linux')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('disables hardware acceleration on Linux', () => {
    it('disables hardware acceleration', async () => {
      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.disableHardwareAcceleration).toHaveBeenCalled()
    })
  })

  describe('parses ELECTRON_EXTRA_LAUNCH_ARGS', () => {
    it('sets launch args', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=true')

      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--quux', 'true')
    })

    it('sets launch args with zero', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=0')

      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--quux', '0')
    })

    it('sets launch args with false', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=false')

      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)

      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--quux', 'false')
    })

    it('sets launch args with multiple values inside quotes', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', `--foo --ipsum=0 --bar=--baz=quux --lorem='--ipsum=dolor --sit=amet'`)

      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--ipsum', '0')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--bar', '--baz=quux')
      expect(mockApp.commandLine.appendSwitch).toHaveBeenCalledWith('--lorem', '--ipsum=dolor --sit=amet')
    })

    it('splits launch args on runs of whitespace outside of quotes only', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', `  --foo   --bar="baz quux"\t--lorem=ip"sum do"lor --empty='' `)

      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch: vi.fn(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(vi.mocked(mockApp.commandLine.appendSwitch).mock.calls.slice(DEFAULT_ELECTRON_FLAGS.length)).toEqual([
        ['--foo'],
        ['--bar', 'baz quux'],
        ['--lorem', 'ip"sum do"lor'],
        ['--empty', ''],
      ])
    })
  })
})
