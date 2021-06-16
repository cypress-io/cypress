import { action, observable, makeObservable } from 'mobx'

import C from './constants'
import projectsStore from '../projects/projects-store'
import appStore from './app-store'

class ViewStore {
  currentView = {
    name: C.LOADING,
  };

  constructor () {
    makeObservable(this, {
      currentView: observable,
      showLoading: action,
      showApp: action,
      showIntro: action,
      showProjectSpecs: action,
      showProjectRuns: action,
      showProjectSettings: action,
    })
  }

  showLoading () {
    this.currentView = {
      name: C.LOADING,
    }
  }

  showApp () {
    if (appStore.projectRoot) {
      this.showProjectSpecs(projectsStore.getProjectByPath(appStore.projectRoot))
    } else {
      this.showIntro()
    }
  }

  showIntro () {
    this.currentView = {
      name: C.INTRO,
    }
  }

  showProjectSpecs (project) {
    this.currentView = {
      name: C.PROJECT_SPECS,
      project,
    }
  }

  isProjectSpecs = () => {
    return this._isView(C.PROJECT_SPECS)
  }

  showProjectRuns (project) {
    this.currentView = {
      name: C.PROJECT_RUNS,
      project,
    }
  }

  isProjectRuns = () => {
    return this._isView(C.PROJECT_RUNS)
  }

  showProjectSettings (project) {
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
