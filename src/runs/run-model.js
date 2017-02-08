import { observable } from 'mobx'

export default class Run {
  @observable id

  constructor (props) {
    this.id = props.id
    this.buildNumber = props.buildNumber
    this.ciProvider = props.ciProvider
    this.ciUrl = props.ciUrl
    this.commitAuthorEmail = props.commitAuthorEmail
    this.commitAuthorName = props.commitAuthorName
    this.commitBranch = props.commitBranch
    this.commitMessage = props.commitMessage
    this.commitSha = props.commitSha
    this.createdAt = props.createdAt
    this.expectedInstances = props.expectedInstances
    this.projectId = props.projectId
    this.status = props.status
    this.totalDuration = props.totalDuration
    this.totalFailures = props.totalFailures
    this.totalPasses = props.totalPasses
    this.totalPending = props.totalPending
    this.instances = props.instances
  }
}
