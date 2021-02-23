import _ from 'lodash'
import { action, observable } from 'mobx'

import DashboardProject from './dashboard-project-model'

export class DashboardProjects {
  @observable projects = []
  @observable error = null
  @observable isLoaded = false

  @action setProjects (projects) {
    this.projects = _.map(projects, (project) => {
      return new DashboardProject(project)
    })

    this.isLoaded = true
  }

  @action addProject (project) {
    this.projects.push(new DashboardProject(project))
  }

  @action setError (err) {
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
