import { action, computed, observable } from 'mobx'

class AppStore {
  @observable projectPath = null
  @observable updateAvailable = false
  @observable version

  @computed get isGlobalMode () {
    return !!this.projectPath
  }

  @action set (props) {
    if (props.projectPath != null) this.projectPath = props.projectPath
    if (props.updateAvailable != null) this.updateAvailable = props.updateAvailable
    if (props.version != null) this.version = props.version
  }
}

export default new AppStore()
