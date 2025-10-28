import os from 'os'
import sinon from 'sinon'
import mockedEnv from 'mocked-env'
import { appendElectronSwitches } from '../../lib/append_electron_switches'

describe('lib/append_electron_switches', () => {
  beforeEach(() => {
    sinon.stub(os, 'platform').returns('linux')
  })

  afterEach(() => {
    sinon.restore()
  })

  // @see https://github.com/electron/electron/issues/46538
  // @see https://github.com/cypress-io/cypress/issues/32361
  context('sets gtk-version=3 in Electron >= 36', () => {
    it('sets launch args', async () => {
      const mockApp = {
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--gtk-version', '3')
    })
  })

  context('disables hardware acceleration on Linux', () => {
    it('disables hardware acceleration', async () => {
      const mockApp = {
        disableHardwareAcceleration: sinon.stub(),
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.disableHardwareAcceleration).to.have.been.called
    })
  })

  context('parses ELECTRON_EXTRA_LAUNCH_ARGS', () => {
    let restore = null

    afterEach(() => {
      if (restore) {
        return restore()
      }
    })

    it('sets launch args', async () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=true',
      })

      const mockApp = {
        disableHardwareAcceleration: sinon.stub(),
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--quux', 'true')
    })

    it('sets launch args with zero', async () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=0',
      })

      const mockApp = {
        disableHardwareAcceleration: sinon.stub(),
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--quux', '0')
    })

    it('sets launch args with false', async () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: '--foo --bar=baz --quux=false',
      })

      const mockApp = {
        disableHardwareAcceleration: sinon.stub(),
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)

      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--bar', 'baz')

      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--quux', 'false')
    })

    it('sets launch args with multiple values inside quotes', async () => {
      restore = mockedEnv({
        ELECTRON_EXTRA_LAUNCH_ARGS: `--foo --ipsum=0 --bar=--baz=quux --lorem='--ipsum=dolor --sit=amet'`,
      })

      const mockApp = {
        disableHardwareAcceleration: sinon.stub(),
        commandLine: {
          appendSwitch: sinon.stub(),
        },
      } as unknown as Electron.App

      appendElectronSwitches(mockApp)
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--foo')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--ipsum', '0')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--bar', '--baz=quux')
      expect(mockApp.commandLine.appendSwitch).to.have.been.calledWith('--lorem', '--ipsum=dolor --sit=amet')
    })
  })
})
