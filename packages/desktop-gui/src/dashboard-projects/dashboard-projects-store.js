import _ from 'lodash'
import { action, observable, makeObservable } from 'mobx'

import DashboardProject from './dashboard-project-model'

export class DashboardProjects {
  projects = [];
  error = null;
  isLoaded = false;

  constructor () {
    makeObservable(this, {
      projects: observable,
      error: observable,
      isLoaded: observable,
      setProjects: action,
      addProject: action,
      setError: action,
    })
  }

  setProjects (projects) {
    this.projects = _.map(projects, (project) => {
      return new DashboardProject(project)
    })

    this.isLoaded = true
  }

  addProject (project) {
    this.projects.push(new DashboardProject(project))
  }

  setError (err) {
    this.error = err
  }

  getProjectById (id) {
    return _.find(this.projects, { id })
  }

  getProjectsByOrgId (orgId) {
    return _.filter(this.projects, { orgId })
  }
}

export default new DashboardProjects()
