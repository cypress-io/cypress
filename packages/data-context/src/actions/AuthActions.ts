import type { DataContext } from '..'
import type { AuthenticatedUserShape, AuthStateShape } from '../data'
import { gql } from '@urql/core'

export interface AuthApiShape {
  getUser(): Promise<Partial<AuthenticatedUserShape>>
  logIn(onMessage: (message: AuthStateShape) => void, utmSource: string, utmMedium: string, utmContent: string | null, signal?: AbortSignal): Promise<AuthenticatedUserShape | undefined>
  signUp(onMessage: (message: AuthStateShape) => void, utmSource: string, utmMedium: string, utmContent: string | null, signal?: AbortSignal): Promise<AuthenticatedUserShape | undefined>
  logOut(): Promise<void>
  resetAuthState(): void
}

export class AuthActions {
  #cancelActiveLogin: (() => void) | null = null

  constructor (private ctx: DataContext) {}

  async getUser () {
    return this.authApi.getUser().then((obj) => {
      if (obj.authToken) {
        this.ctx.coreData.user = obj
        // When we get the user at startup, check the auth by
        // hitting the network
        this.checkAuth().catch((err) => {
          // Don't worry about handling the error here
          this.ctx.logTraceError(err)
        })
      }
    })
  }

  get authApi () {
    return this.ctx._apis.authApi
  }

  async checkAuth () {
    const operationDoc = gql`
      query Cypress_CheckAuth { 
        cloudViewer { 
          id 
          email 
          fullName 
        } 
      }`

    const result = await this.ctx.cloud.executeRemoteGraphQL({
      fieldName: 'cloudViewer',
      operationType: 'query',
      operationDoc,
      operationVariables: {},
    })

    if (!result.data?.cloudViewer && !result.error?.networkError) {
      this.ctx.coreData.user = null
      await this.logout()
    }
  }

  async login (utmSource: string, utmMedium: string, utmContent?: string | null) {
    return this.#authenticate((onMessage, utmSource, utmMedium, utmContent, signal) => {
      return this.authApi.logIn(onMessage, utmSource, utmMedium, utmContent, signal)
    }, utmSource, utmMedium, utmContent)
  }

  async signup (utmSource: string, utmMedium: string, utmContent?: string | null) {
    return this.#authenticate((onMessage, utmSource, utmMedium, utmContent, signal) => {
      return this.authApi.signUp(onMessage, utmSource, utmMedium, utmContent, signal)
    }, utmSource, utmMedium, utmContent)
  }

  async #authenticate (authenticate: AuthApiShape['logIn'], utmSource: string, utmMedium: string, utmContent?: string | null) {
    const onMessage = (authState: AuthStateShape) => {
      this.ctx.update((coreData) => {
        coreData.authState = authState
      })

      // Ensure auth state changes during the login lifecycle
      // are propagated to the clients
      this.ctx.emitter.authChange()
    }

    const ac = new AbortController()

    const user = await new Promise<AuthenticatedUserShape | null | undefined>((resolve, reject) => {
      // A resolver is exposed to the instance so that we can
      // resolve this promise and the original mutation promise
      // if a reset occurs. We also abort the signal so any async
      // work gated on it (e.g. the git-origin lookup) is skipped.
      this.#cancelActiveLogin = () => {
        ac.abort()
        resolve(null)
      }

      // NOTE: auth should never reject, it uses `onMessage` to propagate state changes (including errors) to the frontend.
      authenticate(onMessage, utmSource, utmMedium, utmContent || null, ac.signal).then(resolve, reject)
    })

    const isMainWindowFocused = this.ctx._apis.electronApi.isMainWindowFocused()

    if (!isMainWindowFocused) {
      const isBrowserFocusSupported = this.ctx.coreData.activeBrowser
        && await this.ctx.browser.isFocusSupported(this.ctx.coreData.activeBrowser)

      const isBrowserOpen = this.ctx.coreData.app.browserStatus === 'open'

      if (!isBrowserFocusSupported || !isBrowserOpen) {
        this.ctx._apis.electronApi.focusMainWindow()
      } else {
        await this.ctx.actions.browser.focusActiveBrowserWindow()
      }
    }

    if (!user) {
      // if the user is null, this promise is resolving due to a
      // pending auth mutation cancellation. the state should already
      // be reset, so abort early.
      return
    }

    this.setAuthenticatedUser(user)

    this.#cancelActiveLogin = null

    if (user.projectSlug) {
      const projectSlug = user.projectSlug

      try {
        await this.ctx.actions.project.setProjectIdInConfigFile(projectSlug)

        if (this.ctx.coreData.autoProvisionedProjectId) {
          this.ctx.update((coreData) => {
            coreData.autoProvisionedProjectId = null
          })

          await this.ctx.lifecycleManager.refreshLifecycle()
        }
      } catch {
        this.ctx.update((coreData) => {
          coreData.autoProvisionedProjectId = projectSlug
        })
      }
    }

    this.resetAuthState()
  }

  resetAuthState () {
    // closes the express server opened during login, if it's still open
    this.authApi.resetAuthState()

    // if a login mutation is still in progress, we
    // forcefully resolve it so that the mutation does not persist
    if (this.#cancelActiveLogin) {
      this.#cancelActiveLogin()
      this.#cancelActiveLogin = null
    }

    this.ctx.update((coreData) => {
      coreData.authState = { browserOpened: false }
    })

    this.ctx.emitter.authChange()
  }

  async logout () {
    try {
      this.ctx.update((coreData) => {
        coreData.authState.browserOpened = false
      })

      await this.authApi.logOut()
    } catch (e) {
      this.ctx.logTraceError(e)
    } finally {
      this.setAuthenticatedUser(null)
      this.ctx.cloud.reset()
      this.ctx.emitter.authChange()
      this.ctx.emitter.toApp()
    }
  }

  private setAuthenticatedUser (authUser: AuthenticatedUserShape | null) {
    this.ctx.update((coreData) => {
      coreData.user = authUser
    })

    return this
  }
}
