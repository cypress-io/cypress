import { observable } from 'mobx'

export default class Build {
  @observable buildNum

  constructor (build) {
    this.num = build.buildNum
  }
}
