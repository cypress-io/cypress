import { computed, observable, action } from 'mobx'

class Updater {
  @observable version
  @observable stateFormatted
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

  @computed get state () {
    switch (this.state) {
      case 'checking':
        this.stateFormatted = 'Checking for updates...'
        break
      case 'downloading':
        this.stateFormatted = 'Downloading updates...'
        break
      case 'applying':
        this.stateFormatted = 'Applying updates...'
        break
      case 'done':
        this.stateFormatted = 'Updates ready'
        break
      case 'none':
        this.stateFormatted = 'No updates available'
        break
      case 'error':
        this.stateFormatted = 'An error occurred updating'
        break
      default:
        return
    }
  }
}

export default new Updater()
