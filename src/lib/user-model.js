import { computed, observable } from 'mobx'

export default class User {
  @observable name
  @observable email
  @observable authToken

  constructor (user) {
    this.name = user.name
    this.email = user.email
    this.authToken = user.authToken
  }

  @computed get displayName () {
    return this.name || this.email
  }
}
