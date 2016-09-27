import _ from 'lodash'
import { computed, observable, action } from 'mobx'
import Project from '../project/project-model'

class Projects {
  @observable projects = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false

  @computed get chosen () {
    return _.find(this.projects, { isChosen: true })
  }

  @computed get other () {
    return _.filter(this.projects, (project) => !project.isChosen)
  }

  getProjectById (projectId) {
    return _.find(this.projects, { id: projectId })
  }

  addProject (path) {
    let projectToAdd = {
      path,
    }

    const project = new Project(projectToAdd)
    this.projects.push(project)
    return project
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setProjects (projects) {
    this.projects = _.map(projects, (project) => (
      new Project(project)
    ))

    // get the projects off of localStorage (with statuses)
    // and set them up so we don't have to wait for data from server
    this.projects = _.map(projects, (project) => {
      return _.extend({}, project, _.find(JSON.parse(localStorage.getItem('projects')), { id: project.id }))
    })

    this.projects = _.map(this.projects, (project) => (
      new Project(project)
    ))

    this.isLoading = false
    this.isLoaded = true
  }

  @action setProjectStatuses (projects) {
    //cache in local storage

    this.projects = _.map(this.projects, (project) => {
      return _.extend({}, project, _.find(projects, { id: project.id }))
    })

    localStorage.setItem('projects', JSON.stringify(this.projects))
  }

  @action setError (err) {
    this.error = err
  }

  setChosen (project) {
    this.error = null
    _.each(this.projects, (project) => {
      project.isChosen = false
    })
    project.isChosen = true
  }

  @action removeProject (projectId) {
    this.projects = _.filter(this.projects, (project) => {
      return !(project.id === projectId)
    })
  }
}

export default new Projects()
