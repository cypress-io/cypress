import { computed, observable, makeObservable } from 'mobx'

export default class User {
  name;
  email;
  authToken;

  constructor (user) {
    makeObservable(this, {
      name: observable,
      email: observable,
      authToken: observable,
      displayName: computed,
    })

    this.name = user.name
    this.email = user.email
    this.authToken = user.authToken
  }

  get displayName () {
    return this.name || this.email
  }
}
