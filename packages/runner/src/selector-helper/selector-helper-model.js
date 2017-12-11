import { action, computed, observable } from 'mobx'

class SelectorHelperModel {
  @observable selector = ''
  @observable isEnabled = false
  @observable isShowingHighlight = false
  @observable isValid = true
  @observable numElements = 0

  @computed get playgroundInfo () {
    if (!this.isValid) {
      return 'Invalid selector'
    }

    if (!this.selector) return ''

    return this.numElements === 1 ? '1 element' : `${this.numElements} elements`
  }

  @action toggleEnabled () {
    this.isEnabled = !this.isEnabled

    if (!this.isEnabled) {
      this.selector = null
      this.isShowingHighlight = false
    }
  }

  @action setShowingHighlight (isShowingHighlight) {
    this.isShowingHighlight = isShowingHighlight
  }

  @action setSelector (selector) {
    this.selector = selector
  }

  @action clearSelector () {
    this.selector = ''
    this.numElements = 0
  }

  @action setNumElements (numElements) {
    this.numElements = numElements
  }

  @action setValidity (isValid) {
    this.isValid = isValid
  }
}

export default new SelectorHelperModel()
