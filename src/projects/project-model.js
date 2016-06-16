import _ from 'lodash'
import truncate from 'underscore.string/truncate'
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
    let splitName = _.last(this.path.split('/'))
    return truncate(splitName, 20)
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
