import _ from 'lodash'
import { computed, observable } from 'mobx'
import Project from './project-model'

class Projects {
  @observable projects = []
  @observable error = null

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

  setProjects (projects) {
    this.projects = _.map(projects, (project) => (
      new Project(project)
    ))
  }

  setChosen (project) {
    this.error = null
    _.each(this.projects, (project) => {
      project.isChosen = false
    })
    project.isChosen = true
  }
}

export default new Projects()
