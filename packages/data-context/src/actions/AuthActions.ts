import type { DataContext } from '..'
import type { AuthenticatedUserShape } from '../data'

export interface AuthApiShape {
  logIn(): Promise<AuthenticatedUserShape>
  logOut(): Promise<void>
  checkAuth(context: DataContext): Promise<void>
}

export class AuthActions {
  constructor (private ctx: DataContext) {}

  get authApi () {
    return this.ctx._apis.authApi
  }

  async checkAuth () {
    return this.authApi.checkAuth(this.ctx)
  }

  async login () {
    this.setAuthenticatedUser(await this.authApi.logIn())
  }

  async logout () {
    try {
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
