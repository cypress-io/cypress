import { describe, expect, jest, it } from '@jest/globals'
import type { DataContext } from '../../../src'
import { AuthActions } from '../../../src/actions/AuthActions'
import { createTestDataContext } from '../helper'
import { FoundBrowser } from '@packages/types'

describe('AuthActions', () => {
  describe('.login', () => {
    let ctx: DataContext
    let actions: AuthActions

    beforeEach(() => {
      ctx = createTestDataContext('open')
      // @ts-expect-error - incorrect return type
      ctx._apis.authApi.logIn = jest.fn().mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })

      actions = new AuthActions(ctx)
    })

    it('sets coreData.user', async () => {
      // @ts-expect-error - incorrect number of arguments
      await actions.login()
      expect(ctx.coreData.user).toEqual(expect.objectContaining({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' }))
    })

    it('focuses the main window if there is no activeBrowser', async () => {
      ctx.coreData.activeBrowser = null

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the main window if the activeBrowser does not support focus', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      // @ts-expect-error
      ctx.browser.isFocusSupported = jest.fn().mockImplementation((args) => {
        if (args === browser) {
          return false
        }

        return true
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is closed', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'closed'

      // @ts-expect-error
      ctx.browser.isFocusSupported = jest.fn().mockImplementation((args) => {
        if (args === browser) {
          return true
        }

        return false
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is opening', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'opening'

      // @ts-expect-error
      ctx.browser.isFocusSupported = jest.fn().mockImplementation((args) => {
        if (args === browser) {
          return true
        }

        return false
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the browser if the activeBrowser does support focus and browser is open', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'open'

      // @ts-expect-error
      ctx.browser.isFocusSupported = jest.fn().mockImplementation((args) => {
        if (args === browser) {
          return true
        }

        return false
      })

      // @ts-expect-error
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).not.toHaveBeenCalled()
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).toHaveBeenCalledTimes(1)
    })

    it('does not focus anything if the activeBrowser does support focus but the main window is focused', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      // @ts-expect-error
      ctx.browser.isFocusSupported = jest.fn().mockImplementation((args) => {
        if (args === browser) {
          return true
        }

        return false
      })

      // @ts-expect-error
      ctx._apis.electronApi.isMainWindowFocused = jest.fn().mockReturnValue(true)

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).not.toHaveBeenCalled()
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })
  })
})
