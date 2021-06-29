import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

export interface UserData {
  name: string
  email: string
}

@nxs.objectType({
  definition (t) {
    t.string('name')
    t.string('email')
  },
})
export class User {
  constructor (readonly data: UserData) {
    return proxyEntity(this)
  }

  @nxs.mutationField({
    type: 'Query',
  })
  static logOut () {
    return {}
  }

  authToken () {}

  @nxs.field.string()
  displayName () {
    return this.data.name || this.data.email
  }
}
