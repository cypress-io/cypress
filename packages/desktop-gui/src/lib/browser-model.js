import { computed, observable } from 'mobx'

export default class Browser {
  @observable displayName
  @observable name
  @observable family
  @observable version
  @observable path
  @observable majorVersion
  @observable info
  @observable isChosen = false

  constructor (browser) {
    this.displayName = browser.displayName
    this.name = browser.name
    this.family = browser.family
    this.version = browser.version
    this.path = browser.path
    this.majorVersion = browser.majorVersion
    this.info = browser.info
  }

  @computed get icon () {
    return 'chrome'
  }
}
