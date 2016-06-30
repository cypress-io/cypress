import { observable, asReference } from 'mobx'

import User from '../lib/user-model'

export default observable({
  user: null,
  updateAvailable: false,

  setUser: asReference(function (user) {
    this.user = new User(user)
  }),

  updatesAvailable: (bool) => {
    this.updateAvailabe = bool
  },
})
