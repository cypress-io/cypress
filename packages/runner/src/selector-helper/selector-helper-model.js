import { action, observable } from 'mobx'

class SelectorHelperModel {
  @observable cssSelector = null
  @observable isEnabled = false
  @observable isShowingHighlight = false

  @action toggleEnabled () {
    this.isEnabled = !this.isEnabled

    if (!this.isEnabled) {
      this.cssSelector = null
      this.isShowingHighlight = false
    }
  }

  @action setShowingHighlight (isShowingHighlight) {
    this.isShowingHighlight = isShowingHighlight
  }

  @action setCssSelector (selector) {
    this.cssSelector = selector
  }
}

export default new SelectorHelperModel()
