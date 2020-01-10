import { computed, observable } from 'mobx'
import { browserIcon } from '../lib/utils'

export default class Browser {
  @observable displayName
  @observable name
  @observable family
  @observable version
  @observable path
  @observable majorVersion
  @observable info
  @observable custom
  @observable warning
  @observable isChosen = false

  constructor (browser) {
    this.displayName = browser.displayName
    this.name = browser.name
    this.family = browser.family
    this.version = browser.version
    this.path = browser.path
    this.majorVersion = browser.majorVersion
    this.info = browser.info
    this.custom = browser.custom
    this.warning = browser.warning
  }

  @computed get icon () {
    return browserIcon(this.family)
  }
}
