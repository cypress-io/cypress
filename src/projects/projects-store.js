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

  getProjectByClientId (clientId) {
    return _.find(this.projects, { clientId })
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
    // const localProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    // index for quick lookup
    // const localProjectsIndex = _.keyBy(localProjects, 'id')

    this.projects = _.map(projects, (props) => {
      // const props = _.extend(project, localProjectsIndex[project.id])
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
      project.update(projectsIndex[project.id])
    })

    // TODO: need to serialize a project without transient properties
    // also need to update localStorage when adding or removing projects
    // localStorage.setItem('projects', JSON.stringify(this.projects))
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

  @action removeProject (clientId) {
    const projectIndex = _.findIndex(this.projects, { clientId })

    if (projectIndex != null) {
      this.projects.splice(projectIndex, 1)
    }
  }
}

export default new Projects()
