import { observable } from 'mobx'

class State {
  @observable updateAvailable = false
  @observable version

  projectPath = null

  setProjectPath (projectPath) {
    this.projectPath = projectPath
  }
}

export default new State()
