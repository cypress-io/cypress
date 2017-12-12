import { action, computed, observable } from 'mobx'

const methods = [
  { name: 'get', example: '.foo' },
  { name: 'contains', example: 'Lorem ipsum' },
]

class SelectorHelperModel {
  methods = methods

  @observable selector = ''
  @observable isEnabled = false
  @observable isShowingHighlight = false
  @observable isValid = true
  @observable numElements = 0
  @observable method = methods[0]
  @observable showInfo = true

  @computed get playgroundInfo () {
    if (!this.isValid) {
      return 'Invalid selector'
    }

    if (!this.showInfo || !this.selector) return ''

    return this.numElements === 1 ? '1 element' : `${this.numElements} elements`
  }

  @action toggleEnabled () {
    this.isEnabled = !this.isEnabled

    if (!this.isEnabled) {
      this.selector = null
      this.isShowingHighlight = false
      this.resetMethod()
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

  @action setMethod (method) {
    this.method = method
  }

  @action resetMethod () {
    this.method = methods[0]
  }

  @action setShowInfo (showInfo) {
    this.showInfo = showInfo
  }
}

export default new SelectorHelperModel()
