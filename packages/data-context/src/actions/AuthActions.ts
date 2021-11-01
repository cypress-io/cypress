import type { DataContext } from '..'
import type { AuthenticatedUserShape } from '../data'

interface AuthMessage {type: string, browserOpened: boolean, name: string, message: string}
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
        this.checkAuth()
      }
    })
  }

  get authApi () {
    return this.ctx._apis.authApi
  }

  async checkAuth () {
    const result = await this.ctx.cloud.executeRemoteGraphQL({
      query: `query Cypress_CheckAuth { cloudViewer { id } }`,
      variables: {},
      requestPolicy: 'network-only',
    })

    if (!result.data?.cloudViewer) {
      this.ctx.coreData.user = null
      this.logout()
    }
  }

  async login () {
    this.setAuthenticatedUser(await this.authApi.logIn(({ browserOpened }) => {
      this.ctx.appData.isAuthBrowserOpened = browserOpened
    }))
  }

  async logout () {
    try {
      this.ctx.appData.isAuthBrowserOpened = false
      await this.authApi.logOut()
    } catch {
      //
    }
    this.setAuthenticatedUser(null)
  }

  private setAuthenticatedUser (authUser: AuthenticatedUserShape | null) {
    this.ctx.coreData.user = authUser

    return this
  }
}
