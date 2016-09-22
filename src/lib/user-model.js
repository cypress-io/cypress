import { computed, observable } from 'mobx'

export default class User {
  @observable id
  @observable name
  @observable email
  @observable session_token

  constructor (user) {
    if (user.id) {
      this.id = user.id
      this.name = user.name
      this.email = user.email
      this.session_token = user.session_token
    }
  }

  @computed get displayName () {
    return this.name || this.email
  }
}
