import { nxs, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'

// @ts-ignore
import auth from '@packages/server/lib/gui/auth'

export interface AuthenticatedUser {
  name: string
  email: string
  authToken: string
}

@nxs.objectType({
  description: 'Namespace for information related to authentication with Cypress Cloud',
})
export class User {
  user?: AuthenticatedUser

  constructor (private ctx: BaseContext) {}

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

  @nxs.field.boolean()
  get authenticated (): NxsResult<'User', 'authenticated'> {
    return !!this.user?.authToken
  }

  async authenticate () {
    const msg = (...args: any) => {
      console.log('Message is', ...args)
    }

    const user: AuthenticatedUser = await auth.start(msg, 'launchpad')
    this.user = user
    return this
  }
}