import { describe, expect, jest, it, beforeEach } from '@jest/globals'
import { execute, parse } from 'graphql'
import type { DataContext } from '../../../src'
import { AuthActions } from '../../../src/actions/AuthActions'
import type { AuthenticatedUserShape } from '../../../src/data'
import { createTestDataContext } from '../helper'
import { graphqlSchema } from '../../../graphql/schema'
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

    it('aborts the pending auth and does not set user when resetAuthState is called during login', async () => {
      let capturedSignal: AbortSignal | undefined

      jest.mocked(ctx._apis.authApi.logIn).mockImplementation(
        (_onMessage, _utmSource, _utmMedium, _utmContent, signal) => {
          capturedSignal = signal

          // Simulate the async git-origin lookup being in flight — never resolves
          return new Promise<AuthenticatedUserShape>(() => {})
        },
      )

      const loginPromise = actions.login('Binary: App', 'In-App')

      // The mock is called synchronously before the first await in #authenticate,
      // so capturedSignal is already set here
      expect(capturedSignal).toBeInstanceOf(AbortSignal)
      expect(capturedSignal!.aborted).toBe(false)

      // User cancels while the git-origin lookup is in flight
      actions.resetAuthState()

      // resetAuthState must have aborted the signal so the logIn implementation
      // can gate auth.start on signal.aborted and bail out
      expect(capturedSignal!.aborted).toBe(true)

      // The outer promise resolves via #cancelActiveLogin; user must not be set
      await loginPromise
      expect(ctx.coreData.user).toBeNull()
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

      expect(ctx._apis.authApi.signUp).toHaveBeenCalledWith(expect.any(Function), 'Binary: App', 'Studio', 'Signup', expect.any(AbortSignal))
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

  describe('login with projectSlug', () => {
    let ctx: DataContext
    let actions: AuthActions

    beforeEach(() => {
      ctx = createTestDataContext('open')
      jest.mocked(ctx._apis.authApi.logIn).mockResolvedValue({
        name: 'steve',
        email: 'steve@apple.com',
        authToken: 'foo',
        projectSlug: 'my-project',
      })

      actions = new AuthActions(ctx)
    })

    it('calls setProjectIdInConfigFile with the projectSlug on successful login', async () => {
      const setProjectIdSpy = jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockResolvedValue(undefined)

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(setProjectIdSpy).toHaveBeenCalledWith('my-project')
      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
    })

    it('clears a stale autoProvisionedProjectId and refreshes lifecycle when setProjectIdInConfigFile succeeds', async () => {
      ctx.coreData.autoProvisionedProjectId = 'my-project'
      jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockResolvedValue(undefined)
      const refreshLifecycleSpy = jest.spyOn(ctx.lifecycleManager, 'refreshLifecycle').mockResolvedValue(undefined)

      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
      expect(refreshLifecycleSpy).toHaveBeenCalledTimes(1)
    })

    it('sets autoProvisionedProjectId when setProjectIdInConfigFile fails', async () => {
      jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockRejectedValue(new Error('write error'))
      // @ts-expect-error - incorrect number of arguments
      await actions.login()

      expect(ctx.coreData.autoProvisionedProjectId).toBe('my-project')
    })
  })

  describe('signup with projectSlug', () => {
    let ctx: DataContext
    let actions: AuthActions

    beforeEach(() => {
      ctx = createTestDataContext('open')
      jest.mocked(ctx._apis.authApi.signUp).mockResolvedValue({
        name: 'steve',
        email: 'steve@apple.com',
        authToken: 'foo',
        projectSlug: 'my-project',
      })

      actions = new AuthActions(ctx)
    })

    it('calls setProjectIdInConfigFile with the projectSlug on successful signup', async () => {
      const setProjectIdSpy = jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockResolvedValue(undefined)

      await actions.signup('Binary: App', 'Studio', 'Signup')

      expect(setProjectIdSpy).toHaveBeenCalledWith('my-project')
      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
    })

    it('clears a stale autoProvisionedProjectId and refreshes lifecycle when setProjectIdInConfigFile succeeds during signup', async () => {
      ctx.coreData.autoProvisionedProjectId = 'my-project'
      jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockResolvedValue(undefined)
      const refreshLifecycleSpy = jest.spyOn(ctx.lifecycleManager, 'refreshLifecycle').mockResolvedValue(undefined)

      await actions.signup('Binary: App', 'Studio', 'Signup')

      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
      expect(refreshLifecycleSpy).toHaveBeenCalledTimes(1)
    })

    it('sets autoProvisionedProjectId when setProjectIdInConfigFile fails during signup', async () => {
      jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile').mockRejectedValue(new Error('write error'))
      await actions.signup('Binary: App', 'Studio', 'Signup')

      expect(ctx.coreData.autoProvisionedProjectId).toBe('my-project')
    })
  })

  describe('login without projectSlug', () => {
    it('does not call setProjectIdInConfigFile when projectSlug is absent', async () => {
      const ctx = createTestDataContext('open')

      jest.mocked(ctx._apis.authApi.logIn).mockResolvedValue({ name: 'steve', email: 'steve@apple.com', authToken: 'foo' })
      const setProjectIdSpy = jest.spyOn(ctx.actions.project, 'setProjectIdInConfigFile')

      // @ts-expect-error - incorrect number of arguments
      await new AuthActions(ctx).login()

      expect(setProjectIdSpy).not.toHaveBeenCalled()
      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
    })
  })

  describe('autoProvisionedProjectId query', () => {
    it('returns null when not set', async () => {
      const ctx = createTestDataContext('open')

      const result = await execute({
        schema: graphqlSchema,
        document: parse(`{ autoProvisionedProjectId }`),
        contextValue: ctx,
      })

      expect(result.data?.autoProvisionedProjectId).toBeNull()
    })

    it('returns the project slug when set', async () => {
      const ctx = createTestDataContext('open')

      ctx.coreData.autoProvisionedProjectId = 'my-project'

      const result = await execute({
        schema: graphqlSchema,
        document: parse(`{ autoProvisionedProjectId }`),
        contextValue: ctx,
      })

      expect(result.data?.autoProvisionedProjectId).toBe('my-project')
    })
  })

  describe('clearAutoProvisionedProjectId mutation', () => {
    let ctx: DataContext

    beforeEach(() => {
      ctx = createTestDataContext('open')
      ctx.coreData.autoProvisionedProjectId = 'my-project'
    })

    it('clears autoProvisionedProjectId and notifies both app and launchpad', async () => {
      const toAppSpy = jest.spyOn(ctx.emitter, 'toApp')
      const toLaunchpadSpy = jest.spyOn(ctx.emitter, 'toLaunchpad')

      await execute({
        schema: graphqlSchema,
        document: parse(`mutation { clearAutoProvisionedProjectId }`),
        contextValue: ctx,
      })

      expect(ctx.coreData.autoProvisionedProjectId).toBeNull()
      expect(toAppSpy).toHaveBeenCalledTimes(1)
      expect(toLaunchpadSpy).toHaveBeenCalledTimes(1)
    })
  })
})
