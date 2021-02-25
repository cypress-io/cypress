import { computed, observable } from 'mobx'

export default class DashboardProject {
  @observable id
  @observable name
  @observable repoUrl
  @observable createdAt
  @observable updatedAt
  @observable public
  @observable lastBuildStatus
  @observable lastBuildCreatedAt
  @observable runCompletionDelay
  @observable orgId
  @observable orgName
  @observable orgDefault

  constructor (project) {
    this.id = project.id
    this.name = project.name
    this.repoUrl = project.repoUrl
    this.createdAt = project.createdAt
    this.updatedAt = project.updatedAt
    this.public = project.public
    this.lastBuildStatus = project.lastBuildStatus
    this.lastBuildCreatedAt = project.lastBuildCreatedAt
    this.runCompletionDelay = project.runCompletionDelay
    this.orgId = project.orgId
    this.orgName = project.orgName
    this.orgDefault = project.orgDefault
  }

  @computed get hasLastBuild () {
    return !!this.lastBuildStatus || !!this.lastBuildCreatedAt
  }
}
