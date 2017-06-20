import { action, computed, observable } from 'mobx'

class AppStore {
  @observable projectPath = null
  @observable version
  @observable newVersion

  @computed get isGlobalMode () {
    return !this.projectPath
  }

  @computed get updateAvailable () {
    return this.version !== this.newVersion
  }

  @action set (props) {
    if (props.projectPath != null) this.projectPath = props.projectPath
    if (props.version != null) this.version = this.newVersion = props.version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }
}

export default new AppStore()
