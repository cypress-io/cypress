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

  addProject (path) {
    const project = new Project(path)
    this.projects.push(project)
    return project
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setProjects (paths) {
    this.projects = _.map(paths, (path) => (
      new Project(path)
    ))
    this.isLoading = false
    this.isLoaded = true
  }

  @action setError (err) {
    this.projects.error = err
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
