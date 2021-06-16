import { action, computed, observable, makeObservable } from 'mobx'

const methods = ['get', 'contains']

class SelectorPlaygroundModel {
  methods = methods

  getSelector = 'body';
  containsSelector = 'Hello, World';
  isOpen = false;
  isEnabled = false;
  isShowingHighlight = false;
  isValid = true;
  numElements = 0;
  method = methods[0];

  constructor () {
    makeObservable(this, {
      getSelector: observable,
      containsSelector: observable,
      isOpen: observable,
      isEnabled: observable,
      isShowingHighlight: observable,
      isValid: observable,
      numElements: observable,
      method: observable,
      selector: computed,
      infoHelp: computed,
      toggleEnabled: action,
      setEnabled: action,
      toggleOpen: action,
      setOpen: action,
      setShowingHighlight: action,
      setSelector: action,
      setNumElements: action,
      setValidity: action,
      setMethod: action,
      resetMethod: action,
    })
  }

  get selector () {
    return this.method === 'get' ? this.getSelector : this.containsSelector
  }

  get infoHelp () {
    if (!this.isValid) {
      return 'Invalid selector'
    }

    return this.numElements === 1 ? '1 matched element' : `${this.numElements} matched elements`
  }

  toggleEnabled () {
    this.setEnabled(!this.isEnabled)
  }

  setEnabled (isEnabled) {
    this.isEnabled = isEnabled

    if (!this.isEnabled) {
      this.isShowingHighlight = false
    }
  }

  toggleOpen () {
    this.setOpen(!this.isOpen)
  }

  setOpen (isOpen) {
    this.isOpen = isOpen

    this.setEnabled(this.isOpen)
  }

  setShowingHighlight (isShowingHighlight) {
    this.isShowingHighlight = isShowingHighlight
  }

  setSelector (selector) {
    if (this.method === 'get') {
      this.getSelector = selector
    } else {
      this.containsSelector = selector
    }
  }

  setNumElements (numElements) {
    this.numElements = numElements
  }

  setValidity (isValid) {
    this.isValid = isValid
  }

  setMethod (method) {
    this.method = method
  }

  resetMethod () {
    this.method = methods[0]
  }
}

export const selectorPlaygroundModel = new SelectorPlaygroundModel()
