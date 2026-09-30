import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import { appendElectronSwitches } from '../../lib/append_electron_switches'

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
      const disableHardwareAcceleration = vi.fn()
      const appendSwitch = vi.fn()
      const mockApp = {
        disableHardwareAcceleration,
        commandLine: {
          appendSwitch,
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(disableHardwareAcceleration).toHaveBeenCalled()
    })
  })

  describe('parses ELECTRON_EXTRA_LAUNCH_ARGS', () => {
    it('sets launch args', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=true')

      const appendSwitch = vi.fn()
      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch,
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(appendSwitch).toHaveBeenCalledWith('--foo')
      expect(appendSwitch).toHaveBeenCalledWith('--bar', 'baz')
      expect(appendSwitch).toHaveBeenCalledWith('--quux', 'true')
    })

    it('sets launch args with zero', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=0')

      const appendSwitch = vi.fn()
      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch,
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(appendSwitch).toHaveBeenCalledWith('--foo')
      expect(appendSwitch).toHaveBeenCalledWith('--bar', 'baz')
      expect(appendSwitch).toHaveBeenCalledWith('--quux', '0')
    })

    it('sets launch args with false', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', '--foo --bar=baz --quux=false')

      const appendSwitch = vi.fn()
      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch,
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)

      expect(appendSwitch).toHaveBeenCalledWith('--foo')
      expect(appendSwitch).toHaveBeenCalledWith('--bar', 'baz')
      expect(appendSwitch).toHaveBeenCalledWith('--quux', 'false')
    })

    it('sets launch args with multiple values inside quotes', async () => {
      vi.stubEnv('ELECTRON_EXTRA_LAUNCH_ARGS', `--foo --ipsum=0 --bar=--baz=quux --lorem='--ipsum=dolor --sit=amet'`)

      const appendSwitch = vi.fn()
      const mockApp = {
        disableHardwareAcceleration: vi.fn(),
        commandLine: {
          appendSwitch,
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(appendSwitch).toHaveBeenCalledWith('--foo')
      expect(appendSwitch).toHaveBeenCalledWith('--ipsum', '0')
      expect(appendSwitch).toHaveBeenCalledWith('--bar', '--baz=quux')
      expect(appendSwitch).toHaveBeenCalledWith('--lorem', '--ipsum=dolor --sit=amet')
    })
  })
})
