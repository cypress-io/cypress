import _ from 'lodash'
import { computed, observable, action } from 'mobx'
import Project from '../project/project-model'

class ProjectsStore {
  @observable projects = []
  @observable error = null
  @observable isLoading = false
  @observable _membershipRequestedIds = {}

  @computed get chosen () {
    return _.find(this.projects, { isChosen: true })
  }

  @computed get other () {
    return _.filter(this.projects, (project) => {
      return !project.isChosen
    })
  }

  @computed get clientProjects () {
    return _.map(this.projects, (project) => {
      return _.pick(project, ['path', 'id'])
    })
  }

  @action getProjectByPath (path) {
    if (!this.projects.length) {
      return this.addProject(path)
    }

    return _.find(this.projects, { path })
  }

  @action addProject (path) {
    // projects are sorted by most recently used, so add a project to the start
    // or move it to the start if it already exists
    const existingIndex = _.findIndex(this.projects, { path })
    let project

    if (existingIndex > -1) {
      project = this.projects[existingIndex]
      this.projects.splice(existingIndex, 1)
    } else {
      project = new Project({ path })
    }

    this.projects.unshift(project)

    return project
  }

  @action setLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action setProjects (projects) {
    this.projects = _.map(projects, (project) => {
      return new Project(project)
    })
  }

  @action updateProjectsWithStatuses (projectsWithStatuses = []) {
    const projectsIndex = _.keyBy(projectsWithStatuses, 'id') // index for quick lookup

    _.each(this.projects, (project) => {
      project.update(projectsIndex[project.id])
    })
  }

  @action setError = (err = {}) => {
    this.error = err
  }

  setChosen (project) {
    this.error = null
    _.each(this.projects, (project) => {
      project.isChosen = false
    })

    project.isChosen = true
  }

  @action removeProject ({ path }) {
    const projectIndex = _.findIndex(this.projects, { path })

    if (projectIndex != null) {
      this.projects.splice(projectIndex, 1)
    }
  }

  serializeProjects () {
    return _.map(this.projects, (project) => {
      return project.serialize()
    })
  }

  membershipRequested (id) {
    this._membershipRequestedIds[id] = true
  }

  wasMembershipRequested (id) {
    return this._membershipRequestedIds[id] === true
  }
}

export default new ProjectsStore()
