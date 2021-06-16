import { computed, observable, makeObservable } from 'mobx'

export default class DashboardProject {
  id;
  name;
  repoUrl;
  createdAt;
  updatedAt;
  public;
  lastBuildStatus;
  lastBuildCreatedAt;
  runCompletionDelay;
  orgId;
  orgName;
  orgDefault;

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
    makeObservable(this, {
      id: observable,
      name: observable,
      repoUrl: observable,
      createdAt: observable,
      updatedAt: observable,
      public: observable,
      lastBuildStatus: observable,
      lastBuildCreatedAt: observable,
      runCompletionDelay: observable,
      orgId: observable,
      orgName: observable,
      orgDefault: observable,
      hasLastBuild: computed,
    })
  }

  get hasLastBuild () {
    return !!this.lastBuildStatus || !!this.lastBuildCreatedAt
  }
}
