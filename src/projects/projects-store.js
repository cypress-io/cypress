import _ from 'lodash'
import { observable } from 'mobx'
import Project from './project-store'

class Projects {
  @observable projects = []

  setProjects (projectPaths) {
    this.projects = _.map(projectPaths, (path) => (
      new Project(path)
    ))
  }
}

export default new Projects()
