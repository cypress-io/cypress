import _ from 'lodash'
import { computed, observable, action } from 'mobx'
import Project from './project-model'

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

  addProject (path) {
    const project = new Project({
      path,
      isLoading: true,
    })

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
    this.isLoading = false
    this.isLoaded = true
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
