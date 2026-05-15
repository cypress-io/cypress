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
      jest.mocked(ctx._apis.authApi.logIn).mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })
      jest.mocked(ctx._apis.authApi.signUp).mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })

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

      jest.spyOn(ctx.browser, 'isFocusSupported').mockImplementation((args) => {
        if (args === browser) {
          return Promise.resolve(false)
        }

        return Promise.resolve(true)
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is closed', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'closed'

      jest.spyOn(ctx.browser, 'isFocusSupported').mockImplementation((args) => {
        if (args === browser) {
          return Promise.resolve(true)
        }

        return Promise.resolve(false)
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the main window if the activeBrowser supports focus, but browser is opening', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'opening'

      jest.spyOn(ctx.browser, 'isFocusSupported').mockImplementation((args) => {
        if (args === browser) {
          return Promise.resolve(true)
        }

        return Promise.resolve(false)
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('focuses the browser if the activeBrowser does support focus and browser is open', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      ctx.coreData.app.browserStatus = 'open'

      jest.spyOn(ctx.browser, 'isFocusSupported').mockImplementation((args) => {
        if (args === browser) {
          return Promise.resolve(true)
        }

        return Promise.resolve(false)
      })

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).not.toHaveBeenCalled()
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).toHaveBeenCalledTimes(1)
    })

    it('does not focus anything if the activeBrowser does support focus but the main window is focused', async () => {
      const browser = ctx.coreData.activeBrowser = { name: 'foo' } as FoundBrowser

      jest.spyOn(ctx.browser, 'isFocusSupported').mockImplementation((args) => {
        if (args === browser) {
          return Promise.resolve(true)
        }

        return Promise.resolve(false)
      })

      jest.spyOn(ctx._apis.electronApi, 'isMainWindowFocused').mockReturnValue(true)

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx._apis.electronApi.focusMainWindow).not.toHaveBeenCalled()
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })
  })

  describe('.signup', () => {
    let ctx: DataContext
    let actions: AuthActions

    beforeEach(() => {
      ctx = createTestDataContext('open')
      jest.mocked(ctx._apis.authApi.logIn).mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })
      jest.mocked(ctx._apis.authApi.signUp).mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })

      actions = new AuthActions(ctx)
    })

    it('sets coreData.user', async () => {
      await actions.signup('Binary: App', 'Studio', 'Signup')
      expect(ctx.coreData.user).toEqual(expect.objectContaining({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' }))
    })

    it('calls authApi.signUp with utm parameters', async () => {
      await actions.signup('Binary: App', 'Studio', 'Signup')

      expect(ctx._apis.authApi.signUp).toHaveBeenCalledWith(expect.any(Function), 'Binary: App', 'Studio', 'Signup')
      expect(ctx._apis.authApi.logIn).not.toHaveBeenCalled()
    })

    it('focuses the main window after successful signup auth', async () => {
      ctx.coreData.activeBrowser = null

      await actions.signup('Binary: App', 'Studio', 'Signup')

      expect(ctx._apis.electronApi.focusMainWindow).toHaveBeenCalledTimes(1)
      expect(ctx._apis.browserApi.focusActiveBrowserWindow).not.toHaveBeenCalled()
    })

    it('rejects and does not set coreData.user when signUp rejects', async () => {
      jest.mocked(ctx._apis.authApi.signUp).mockRejectedValue(new Error('signup error'))

      await expect(actions.signup('Binary: App', 'Studio', 'Signup')).rejects.toThrow('signup error')
      expect(ctx.coreData.user).toBeNull()
    })
  })
})
