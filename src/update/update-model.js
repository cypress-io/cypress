import { computed, observable, action } from 'mobx'

class Updater {
  @observable version
  @observable finished = false

  @action setVersion (version) {
    this.version = version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }

  @action setState (state) {
    this.state = state
  }

  @computed get stateFormatted () {
    switch (this.state) {
      case 'checking':
        'Checking for updates...'
        break
      case 'downloading':
        'Downloading updates...'
        break
      case 'applying':
        'Applying updates...'
        break
      case 'done':
        'Updates ready'
        break
      case 'none':
        'No updates available'
        break
      case 'error':
        'An error occurred updating'
        break
      default:
        return
    }
  }
}

export default new Updater()
