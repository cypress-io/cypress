import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Project {
  @observable path = ''
  @observable isChosen = false
  @observable isLoading = false
  @observable browsers = []
  @observable error = null

  constructor ({ path, isLoading }) {
    this.path = path
    this.isLoading = isLoading
  }

  @computed get name () {
    return _.last(this.path.split('/'))
  }

  @computed get defaultBrowser () {
    return _.find(this.browsers, { default: true }) || this.browsers[0]
  }

  setBrowsers (browsers) {
    this.browsers = browsers
    this.setChosenBrowser(this.defaultBrowser)
  }

  setChosenBrowser (browser) {
    _.each(this.browsers, (browser) => {
      browser.isChosen = false
    })
    browser.isChosen = true
  }

  setChosenBrowserByName (name) {
    const browser = _.find(this.browsers, { name })
    this.setChosenBrowser(browser)
  }

  reset () {
    this.error = null
  }
}
