import type { DataContext } from '..'
import type { AuthenticatedUserShape } from '../data'

export interface AuthApiShape {
  logIn(): Promise<AuthenticatedUserShape>
  logOut(): Promise<void>
  refreshUser(): Promise<unknown>
}

export class AuthActions {
  constructor (private ctx: DataContext, private authApi: AuthApiShape) {}

  async refreshUser () {
    // // TODO(tim): This should be injected, we should avoid async feching
    // // in constructors like this
    // user.get().then((cachedUser: AuthenticatedUser) => {
    //   // cache returns empty object if user is undefined
    //   if (cachedUser.authToken) {
    //     this._authenticatedUser = cachedUser
    //   }

    //   // TODO(tim): This is a huge hack. We need to cleanup the whole user auth layer
    //   Promise.resolve(execute({
    //     schema: this._remoteSchema,
    //     document: parse(`{ cloudViewer { id } }`),
    //     contextValue: this,
    //   })).then((result) => {
    //     if (!result.data?.cloudViewer) {
    //       this._authenticatedUser = null
    //       user.logOut()
    //     }
    //   })
    // })
  }

  async logIn () {
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
