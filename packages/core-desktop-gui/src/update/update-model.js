import { computed, observable, action } from 'mobx'

import App from '../lib/app'

class Updater {
  @observable version
  @observable state
  @observable finished = false

  @action setVersion (version) {
    this.version = version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }

  @action setState (state) {
    switch (state) {
      case 'error':
      case 'done':
      case 'none':
        this.finished = true
        this.state = state
        break
      default:
        this.state = state
    }

    return this.state
  }

  @computed get stateFormatted () {
    let result

    switch (this.state) {
      case 'checking':
        result = 'Checking for updates...'
        break
      case 'downloading':
        result = 'Downloading updates...'
        break
      case 'applying':
        result = 'Applying updates...'
        break
      case 'done':
        result = 'Updates ready'
        break
      case 'none':
        result = 'No updates available'
        break
      case 'error':
        result = 'An error occurred updating: \nYou can manually update Cypress by running \'cypress install\' from your terminal or by downloading it again.'
        break
      default:
        result = ""
    }

    return result
  }

  @computed get buttonFormatted () {

    if (this.state === 'done') {
      return 'Restart'
    } else {
      return 'Done'
    }
  }

  openUpdateWindow () {
    return App.ipc('window:open', {
      position: "center",
      width: 300,
      height: 240,
      toolbar: false,
      title: "Updates",
      type: "UPDATES",
    })
  }
}

export default new Updater()
