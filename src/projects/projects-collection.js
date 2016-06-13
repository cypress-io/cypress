import _ from 'lodash'
import { observable } from 'mobx'
import ProjectModel from './project-model'

class ProjectsCollection {
  @observable projects = []

  setProjects (projectPaths) {
    this.projects = _.map(projectPaths, (path) => (
      new ProjectModel(path)
    ))
  }
}

export default new ProjectsCollection()
