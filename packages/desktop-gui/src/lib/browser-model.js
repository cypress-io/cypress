import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Browser {
  @observable name
  @observable version
  @observable path
  @observable majorVersion
  @observable info
  @observable isChosen = false

  constructor (browser) {
    this.name = browser.name
    this.version = browser.version
    this.path = browser.path
    this.majorVersion = browser.majorVersion
    this.info = browser.info
  }

  @computed get displayName () {
    return _.capitalize(this.name)
  }

  @computed get icon () {
    return 'chrome'
  }
}
