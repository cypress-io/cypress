import { describe, expect, it, jest } from '@jest/globals'
import type { App, BrowserWindow } from 'electron'
import { createTestDataContext } from '../helper'

describe('ElectronActions', () => {
  describe('#showBrowserWindow', () => {
    const fakeWindow = () => {
      const win = { show: jest.fn(), setSkipTaskbar: jest.fn() }

      // Safe because `showBrowserWindow` only calls `show` and `setSkipTaskbar`
      return { win, browserWindow: win as unknown as BrowserWindow }
    }

    it('shows the main window', () => {
      const ctx = createTestDataContext('open')
      const { win, browserWindow } = fakeWindow()

      ctx.actions.electron.setBrowserWindow(browserWindow)
      ctx.actions.electron.showBrowserWindow()

      expect(win.show).toHaveBeenCalledTimes(1)
    })

    it('leaves the window and its Dock icon hidden with --headless', () => {
      const ctx = createTestDataContext('open', { headless: true })
      const { win, browserWindow } = fakeWindow()
      const dockShow = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)

      // Safe because only `dock.show` is read
      ctx.config.electronApp = { dock: { show: dockShow } } as unknown as App
      ctx.actions.electron.setBrowserWindow(browserWindow)
      ctx.actions.electron.showBrowserWindow()

      expect(win.show).not.toHaveBeenCalled()
      expect(win.setSkipTaskbar).not.toHaveBeenCalled()
      expect(dockShow).not.toHaveBeenCalled()
    })
  })
})
