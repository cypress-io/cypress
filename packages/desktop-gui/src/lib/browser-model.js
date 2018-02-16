import { computed, observable } from 'mobx'

export default class Browser {
  @observable name
  @observable displayName
  @observable version
  @observable path
  @observable majorVersion
  @observable info
  @observable isChosen = false

  constructor (browser) {
    this.name = browser.name
    this.displayName = browser.displayName
    this.version = browser.version
    this.path = browser.path
    this.majorVersion = browser.majorVersion
    this.info = browser.info
  }

  @computed get icon () {
    return 'chrome'
  }
}
