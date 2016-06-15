import { observable, asReference } from 'mobx'

import User from '../lib/user-store'

export default observable({
  user: null,

  setUser: asReference(function (user) {
    this.user = new User(user)
  }),
})
