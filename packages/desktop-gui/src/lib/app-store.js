import { action, computed, observable } from 'mobx'

class AppStore {
  @observable updateAvailable = false
  @observable version
  @observable projectPath = null

  @computed get isGlobalMode () {
    return !!this.projectPath
  }

  @action setProjectPath (projectPath) {
    this.projectPath = projectPath
  }
}

export default new AppStore()
