import _ from 'lodash'
import md5 from 'md5'
import { computed, observable, action } from 'mobx'
import Browser from '../lib/browser-model'

export default class Project {
  @observable id
  @observable path
  @observable isChosen = false
  @observable isLoading = false
  @observable isNew = false
  @observable browsers = []
  @observable onBoardingModalOpen = false
  @observable browserState = "closed"
  @observable resolvedConfig = {}
  @observable error
  @observable parentTestsFolderDisplay
  @observable integrationExampleName

  constructor (path) {
    this.id = md5(path)
    this.path = path
  }

  @computed get name () {
    let splitName = _.last(this.path.split('/'))
    return _.truncate(splitName, { length: 60 })
  }

  @computed get displayPath () {
    const strLength = 75
    let pathLength = this.path.length

    if (pathLength > strLength) {
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

  @action openModal () {
    this.onBoardingModalOpen = true
  }

  @action closeModal () {
    this.onBoardingModalOpen = false
  }

  @action browserOpening () {
    this.browserState = "opening"
  }

  @action browserOpened () {
    this.browserState = "opened"
  }

  @action browserClosed () {
    this.browserState = "closed"
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

  setOnBoardingConfig (config) {
    this.isNew = config.isNewProject
    this.parentTestsFolderDisplay = config.parentTestsFolderDisplay
    this.integrationExampleName = config.integrationExampleName
  }

  setResolvedConfig (resolved) {
    this.resolvedConfig = resolved
  }

  @action setError (err) {
    this.error = err
  }

  setChosenBrowserByName (name) {
    const browser = _.find(this.browsers, { name })
    this.setChosenBrowser(browser)
  }

  @action reset () {
    this.error = undefined
  }
}
