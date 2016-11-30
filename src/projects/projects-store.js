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
    // get the projects off of localStorage (with statuses)
    // and set them up so we don't have to wait for data from server
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    // index for quick lookup
    const localProjectsIndex = _.keyBy(localProjects, 'id')

    this.projects = _.map(projects, (project) => {
      const props = _.extend(project, localProjectsIndex[project.id])
      return new Project(props)
    })

    this.isLoading = false
    this.isLoaded = true
  }

  @action setProjectStatuses (projects) {
    // index for quick lookup
    const projectsIndex = _.keyBy(projects, 'id')

    // merge projects received from api with what we
    // already have in memory
    _.each(this.projects, (project) => {
      _.extend(project, projectsIndex[project.id])
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
