import { OperationTypeNode } from 'graphql'
import type { DataContext } from '..'
import type { AuthenticatedUserShape, AuthStateShape } from '../data'

export interface AuthApiShape {
  getUser(): Promise<Partial<AuthenticatedUserShape>>
  logIn(onMessage: (message: AuthStateShape) => void): Promise<AuthenticatedUserShape>
  logOut(): Promise<void>
  resetAuthState(): void
}

export class AuthActions {
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
    const result = await this.ctx.cloud.executeRemoteGraphQL({
      operationType: OperationTypeNode.QUERY,
      query: `query Cypress_CheckAuth { cloudViewer { id } }`,
      variables: {},
      requestPolicy: 'network-only',
    })

    if (!result.data?.cloudViewer) {
      this.ctx.coreData.user = null
      await this.logout()
    }
  }

  async login () {
    const loginPromise = new Promise<AuthenticatedUserShape | null>((resolve, reject) => {
      // A resolver is exposed to the instance so that we can
      // resolve this promise and the original mutation promise
      // if a reset occurs
      this.ctx.update((coreData) => {
        coreData.cancelActiveLogin = () => resolve(null)
      })

      this.authApi.logIn((authState) => {
        this.ctx.update((coreData) => {
          coreData.authState = authState
        })

        // Ensure auth state changes during the login lifecycle
        // are propagated to the clients
        this.ctx.emitter.authChange()
      }).then(resolve, reject)
    })

    const user = await loginPromise

    if (!user) {
      // if the user is null, this promise is resolving due to a
      // login mutation cancellation. the state should already
      // be reset, so abort early.
      return
    }

    this.setAuthenticatedUser(user as AuthenticatedUserShape)

    this.ctx.update((coreData) => {
      coreData.cancelActiveLogin = null
    })

    this.resetAuthState()
  }

  resetAuthState () {
    // closes the express server opened during login, if it's still open
    this.authApi.resetAuthState()

    // if a login mutation is still in progress, we
    // forcefully resolve it so that the mutation does not persist
    if (this.ctx.coreData.cancelActiveLogin) {
      this.ctx.coreData.cancelActiveLogin()

      this.ctx.update((coreData) => {
        coreData.cancelActiveLogin = null
      })
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
    }
  }

  private setAuthenticatedUser (authUser: AuthenticatedUserShape | null) {
    this.ctx.update((coreData) => {
      coreData.user = authUser
    })

    return this
  }
}
