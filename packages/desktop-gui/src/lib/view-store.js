import { action, observable } from 'mobx'

import C from './constants'
import projectsStore from '../projects/projects-store'
import appStore from './app-store'

class ViewStore {
  @observable currentView = {
    name: C.LOADING,
  }

  @action showApplyingUpdates () {
    this.currentView = {
      name: C.APPLYING_UPDATES,
    }
  }

  isApplyingUpdates () {
    return this._isView(C.APPLYING_UPDATES)
  }

  @action showLoading () {
    this.currentView = {
      name: C.LOADING,
    }
  }

  @action showLogin () {
    this.currentView = {
      name: C.LOGIN,
    }
  }

  @action showApp () {
    if (appStore.projectPath) {
      this.showProjectSpecs(projectsStore.getProjectByPath(appStore.projectPath))
    } else {
      this.showIntro()
    }
  }

  @action showIntro () {
    this.currentView = {
      name: C.INTRO,
    }
  }

  @action showProjectSpecs (project) {
    this.currentView = {
      name: C.PROJECT_SPECS,
      project,
    }
  }

  isProjectSpecs = () => {
    return this._isView(C.PROJECT_SPECS)
  }

  @action showProjectRuns (project) {
    this.currentView = {
      name: C.PROJECT_RUNS,
      project,
    }
  }

  isProjectRuns = () => {
    return this._isView(C.PROJECT_RUNS)
  }

  @action showProjectConfig (project) {
    this.currentView = {
      name: C.PROJECT_CONFIG,
      project,
    }
  }

  isProjectConfig = () => {
    return this._isView(C.PROJECT_CONFIG)
  }

  _isView (name) {
    return this.currentView.name === name
  }
}

export default new ViewStore()
