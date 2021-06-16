import _ from 'lodash'
import { computed, observable, action, makeObservable } from 'mobx'
import Project from '../project/project-model'

class ProjectsStore {
  projects = [];
  error = null;
  isLoading = false;
  _membershipRequestedIds = {};

  constructor () {
    makeObservable(this, {
      projects: observable,
      error: observable,
      isLoading: observable,
      _membershipRequestedIds: observable,
      chosen: computed,
      other: computed,
      clientProjects: computed,
      getProjectByPath: action,
      addProject: action,
      setLoading: action,
      setProjects: action,
      updateProjectsWithStatuses: action,
      setError: action,
      removeProject: action,
    })
  }

  get chosen () {
    return _.find(this.projects, { isChosen: true })
  }

  get other () {
    return _.filter(this.projects, (project) => {
      return !project.isChosen
    })
  }

  get clientProjects () {
    return _.map(this.projects, (project) => {
      return _.pick(project, ['path', 'id'])
    })
  }

  getProjectByPath (path) {
    if (!this.projects.length) {
      return this.addProject(path)
    }

    return _.find(this.projects, { path })
  }

  addProject (path) {
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

  setLoading (isLoading) {
    this.isLoading = isLoading
  }

  setProjects (projects) {
    this.projects = _.map(projects, (project) => {
      return new Project(project)
    })
  }

  updateProjectsWithStatuses (projectsWithStatuses = []) {
    const projectsIndex = _.keyBy(projectsWithStatuses, 'id') // index for quick lookup

    _.each(this.projects, (project) => {
      project.update(projectsIndex[project.id])
    })
  }

  setError = (err = {}) => {
    this.error = err
  };

  setChosen (project) {
    this.error = null
    _.each(this.projects, (project) => {
      project.isChosen = false
    })

    project.isChosen = true
  }

  removeProject ({ path }) {
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
