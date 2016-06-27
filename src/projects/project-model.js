import _ from 'lodash'
import { computed, observable, action } from 'mobx'
import Browser from '../lib/browser-model'

export default class Project {
  @observable id
  @observable path = ''
  @observable isChosen = false
  @observable isLoading = false
  @observable browsers = []
  @observable error = null

  constructor ({ id, path, isLoading }) {
    this.id = id
    this.path = path
    this.isLoading = isLoading
  }

  @computed get name () {
    let splitName = _.last(this.path.split('/'))
    return _.truncate(splitName, 20)
  }

  @computed get displayPath () {
    const strLength = 30
    let pathLength = this.path.length

    if (pathLength > 30) {
      let truncatedPath = this.path.slice((pathLength - 1) - strLength, pathLength)
      return '...'.concat(truncatedPath)
    } else {
      return this.path
    }
  }

  @computed get otherBrowsers () {
    return _.filter(this.browsers, { isChosen: false })
  }

  @computed get chosenBrowser () {
    return _.find(this.browsers, { isChosen: true })
  }

  @computed get defaultBrowser () {
    return this.browsers[0]
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setBrowsers (browsers) {
    if (browsers.length) {
      this.browsers = _.map(browsers, (browser) => {
        return new Browser(browser)
      })
      this.setChosenBrowser(this.defaultBrowser)
    }
  }

  @action setChosenBrowser (browser) {
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
