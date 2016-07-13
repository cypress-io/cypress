import { computed, observable, action } from 'mobx'

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
        result = 'An error occurred updating'
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
}

export default new Updater()
