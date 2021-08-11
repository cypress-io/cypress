import { nxs, NxsResult } from 'nexus-decorators'

export interface AuthenticatedUser {
  name: string
  email: string
  authToken: string
}

@nxs.objectType({
  description: 'Namespace for information related to authentication with Cypress Cloud',
})
export class User {
  constructor (private user: AuthenticatedUser) {}

  @nxs.field.string()
  get name (): NxsResult<'User', 'name'> {
    return this.user?.name ?? null
  }

  @nxs.field.string()
  get email (): NxsResult<'User', 'email'> {
    return this.user?.email ?? null
  }

  @nxs.field.string()
  get authToken (): NxsResult<'User', 'authToken'> {
    return this.user?.authToken ?? null
  }
}
