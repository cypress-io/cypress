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
    const obj = await this.authApi.getUser()

    if (obj.authToken) {
      this.ctx.update((o) => {
        o.user = obj
      })

      // When we get the user at startup, check the auth by
      // hitting the network
      this.checkAuth().catch((e) => {
        this.ctx.logError(e)
      })
    }

    return obj
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
      this.ctx.update((o) => {
        o.user = null
      })

      this.logout().catch((e) => {
        this.ctx.logError(e)
      })
    }
  }

  async login () {
    this.setAuthenticatedUser(await this.authApi.logIn(({ browserOpened }) => {
      this.ctx.update((o) => {
        o.isAuthBrowserOpened = browserOpened
      })
    }))
  }

  async logout () {
    try {
      this.ctx.update((o) => {
        o.isAuthBrowserOpened = false
      })

      await this.authApi.logOut()
    } catch {
      //
    }
    this.setAuthenticatedUser(null)
  }

  private setAuthenticatedUser (authUser: AuthenticatedUserShape | null) {
    this.ctx.update((o) => {
      o.user = authUser
    })

    return this
  }
}
