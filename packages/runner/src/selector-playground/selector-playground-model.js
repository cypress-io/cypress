import { action, computed, observable } from 'mobx'

const methods = ['get', 'contains']

class SelectorPlaygroundModel {
  methods = methods

  @observable getSelector = 'body'
  @observable containsSelector = 'Hello, World'
  @observable isOpen = false
  @observable isEnabled = false
  @observable isShowingHighlight = false
  @observable isValid = true
  @observable numElements = 0
  @observable method = methods[0]

  @computed get selector () {
    return this.method === 'get' ? this.getSelector : this.containsSelector
  }

  @computed get infoHelp () {
    if (!this.isValid) {
      return 'Invalid selector'
    }

    return this.numElements === 1 ? '1 matched element' : `${this.numElements} matched elements`
  }

  @action toggleEnabled () {
    this.setEnabled(!this.isEnabled)
  }

  @action setEnabled (isEnabled) {
    this.isEnabled = isEnabled

    if (!this.isEnabled) {
      this.isShowingHighlight = false
    }
  }

  @action toggleOpen () {
    this.setOpen(!this.isOpen)
  }

  @action setOpen (isOpen) {
    this.isOpen = isOpen

    this.setEnabled(this.isOpen)
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

export default new SelectorPlaygroundModel()
