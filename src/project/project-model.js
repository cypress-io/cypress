import _ from 'lodash'
import md5 from 'md5'
import { computed, observable, action } from 'mobx'
import Browser from '../lib/browser-model'

// const strLength = 75

export default class Project {
  @observable id
  @observable path
  @observable isChosen = false
  @observable isLoading = false
  @observable isNew = false
  @observable browsers = []
  @observable onBoardingModalOpen = false
  @observable browserState = "closed"
  @observable resolvedConfig
  @observable error
  @observable parentTestsFolderDisplay
  @observable integrationExampleName
  @observable projectId

  constructor (project) {
    // if the project has been setup, it may
    // have a generated ID already, otherwise make
    // an arbitrary one for the list.
    if (project.id) {
      this.id = project.id
    } else {
      this.id = md5(project.path)
    }
    this.path = project.path
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
    return this.isLoading = bool
  }

  @action openModal () {
    return this.onBoardingModalOpen = true
  }

  @action closeModal () {
    return this.onBoardingModalOpen = false
  }

  @action browserOpening () {
    return this.browserState = "opening"
  }

  @action browserOpened () {
    return this.browserState = "opened"
  }

  @action browserClosed () {
    return this.browserState = "closed"
  }

  @action setBrowsers (browsers = []) {
    if (browsers.length) {
      this.browsers = _.map(browsers, (browser) => {
        return new Browser(browser)
      })
      // if they already have a browser chosen
      // that's been saved in localStorage, then select that
      // otherwise just do the default.
      if (localStorage.getItem('chosenBrowser')) {
        this.setChosenBrowserByName(localStorage.getItem('chosenBrowser'))
      } else {
        return this.setChosenBrowser(this.defaultBrowser)
      }
    }
  }

  @action setChosenBrowser (browser) {
    _.each(this.browsers, (browser) => {
      browser.isChosen = false
    })
    localStorage.setItem('chosenBrowser', browser.name)
    return browser.isChosen = true
  }

  @action setProjectId (id) {
    // we need to know if the server has setup an id
    // and that it isn't just present on the front-end
    this.projectId = id
  }

  @action setOnBoardingConfig (config) {
    this.isNew = config.isNewProject
    this.integrationExampleFile = config.integrationExampleFile
    this.integrationFolder = config.integrationFolder
    this.parentTestsFolderDisplay = config.parentTestsFolderDisplay
    this.fileServerFolder = config.fileServerFolder
    return this.integrationExampleName = config.integrationExampleName
  }

  @action setResolvedConfig (resolved) {
    return this.resolvedConfig = resolved
  }

  @action setError (err) {
    return this.error = err
  }

  setChosenBrowserByName (name) {
    const browser = _.find(this.browsers, { name })
    return this.setChosenBrowser(browser)
  }

  @action clearError () {
    return this.error = undefined
  }
}
