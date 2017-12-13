import { action, computed, observable } from 'mobx'

const methods = ['get', 'contains']

class SelectorHelperModel {
  methods = methods

  @observable getSelector = ''
  @observable containsSelector = ''
  @observable isEnabled = false
  @observable isShowingHighlight = false
  @observable isValid = true
  @observable numElements = 0
  @observable method = methods[0]

  @computed get selector () {
    return this.method === 'get' ? this.getSelector : this.containsSelector
  }

  @computed get info () {
    if (!this.isValid) {
      return 'x'
    }

    return this.numElements
  }

  @computed get infoHelp () {
    if (!this.isValid) {
      return 'Invalid selector'
    }

    return this.numElements === 1 ? '1 matched element' : `${this.numElements} matched elements`
  }

  @action toggleEnabled () {
    this.isEnabled = !this.isEnabled

    if (!this.isEnabled) {
      this.isShowingHighlight = false
    }
  }

  @action setShowingHighlight (isShowingHighlight) {
    this.isShowingHighlight = isShowingHighlight
  }

  @action setSelector (selector) {
    if (this.method === 'get') {
      this.getSelector = selector
    } else {
      this.containsSelector = selector
    }
  }

  @action setNumElements (numElements) {
    this.numElements = numElements
  }

  @action setValidity (isValid) {
    this.isValid = isValid
  }

  @action setMethod (method) {
    this.method = method
  }

  @action resetMethod () {
    this.method = methods[0]
  }
}

export default new SelectorHelperModel()
