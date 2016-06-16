import { observable, asReference } from 'mobx'

import User from '../lib/user-model'

export default observable({
  user: null,

  setUser: asReference(function (user) {
    this.user = new User(user)
  }),
})
