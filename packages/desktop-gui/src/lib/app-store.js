import { action, computed, observable } from 'mobx'

class AppStore {
  @observable os
  @observable projectPath = null
  @observable newVersion
  @observable version

  @computed get isGlobalMode () {
    return !this.projectPath
  }

  @computed get updateAvailable () {
    return this.version !== this.newVersion
  }

  @action set (props) {
    if (props.os != null) this.os = props.os
    if (props.projectPath != null) this.projectPath = props.projectPath
    if (props.version != null) this.version = this.newVersion = props.version
  }

  @action setNewVersion (newVersion) {
    this.newVersion = newVersion
  }
}

export default new AppStore()
