import { computed, observable, action } from 'mobx'

import App from '../lib/app'
import User from '../lib/user-model'
import updater from '../update/update-model'

class State {
  @observable userLoaded = false
  @observable user = null
  @observable updateAvailable = false
  @observable modalOpen = false
  @observable version

  @computed get hasUser () {
    return !!this.user && !!this.user.sessionToken
  }

  @action setUser (user) {
    return this.user = user ? new User(user) : null
  }

  @action setVersion (version) {
    this.version = version
  }

  updatesAvailable (bool) {
    this.updateAvailable = bool
  }

  openModal () {
    this.modalOpen = true
  }

  closeModal () {
    this.modalOpen = false
  }

  logOut () {
    this.setUser(null)

    App.ipc('clear:github:cookies')
    App.ipc('log:out')
  }

  listenForMenuClicks () {
    return App.ipc("on:menu:clicked", (err, item) => {
      switch (item) {
        case 'log:out':
          this.logOut()
          break
        case 'check:for:updates':
          updater.openUpdateWindow()
          break
        default:
          return
      }
    })
  }

}

export default new State()
