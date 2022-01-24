import type { DataContext } from '..'
import type { AuthenticatedUserShape } from '../data'

export interface AuthMessage {type: string, browserOpened: boolean, name: string, message: string}

export interface AuthApiShape {
  getUser(): Promise<Partial<AuthenticatedUserShape>>
  logIn(onMessage: (message: AuthMessage) => void): Promise<AuthenticatedUserShape>
  logOut(): Promise<void>
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
      operationType: 'query',
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
    this.setAuthenticatedUser(await this.authApi.logIn(({ browserOpened }) => {
      this.ctx.coreData.isAuthBrowserOpened = browserOpened
    }))
  }

  async logout () {
    try {
      this.ctx.coreData.isAuthBrowserOpened = false
      await this.authApi.logOut()
    } catch (e) {
      this.ctx.logTraceError(e)
    } finally {
      this.setAuthenticatedUser(null)
      this.ctx.cloud.reset()
    }
  }

  private setAuthenticatedUser (authUser: AuthenticatedUserShape | null) {
    this.ctx.coreData.user = authUser

    return this
  }
}
