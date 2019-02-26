import { action, observable } from 'mobx'

import C from './constants'
import projectsStore from '../projects/projects-store'
import appStore from './app-store'

class ViewStore {
  @observable currentView = {
    name: C.LOADING,
  }

  @action showLoading () {
    this.currentView = {
      name: C.LOADING,
    }
  }

  @action showApp () {
    if (appStore.projectRoot) {
      this.showProjectSpecs(projectsStore.getProjectByPath(appStore.projectRoot))
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

  @action showProjectSettings (project) {
    this.currentView = {
      name: C.PROJECT_SETTINGS,
      project,
    }
  }

  isProjectSettings = () => {
    return this._isView(C.PROJECT_SETTINGS)
  }

  _isView (name) {
    return this.currentView.name === name
  }
}

export default new ViewStore()
