import { observable, asReference } from 'mobx'
import UserModel from '../lib/user-model'

export default observable({
  user: null,

  setUser: asReference(function (user) {
    this.user = new UserModel(user)
  }),
})
