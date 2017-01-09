import _ from 'lodash'
import md5 from 'md5'
import { computed, observable, action } from 'mobx'
import Browser from '../lib/browser-model'

const persistentProps = [
  'id',
  'name',
  'public',
  'orgName',
  'orgId',
  'defaultOrg',
  'lastBuildStatus',
  'lastBuildCreatedAt',
]

const validProps = persistentProps.concat([
  'state',
  'clientId',
  'isChosen',
  'isLoading',
  'isNew',
  'browsers',
  'onBoardingModalOpen',
  'browserState',
  'resolvedConfig',
  'error',
  'parentTestsFolderDisplay',
  'integrationExampleName',
])

export default class Project {
  // state constants
  static VALID = 'VALID'
  static INVALID = 'INVALID'
  static UNAUTHORIZED = 'UNAUTHORIZED'

  // persisted with api
  @observable id
  @observable name
  @observable public
  @observable lastBuildStatus
  @observable lastBuildCreatedAt
  @observable orgName
  @observable orgId
  @observable defaultOrg
  // comes from ipc, but not persisted
  @observable state = Project.VALID
  // local state
  @observable clientId
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
  // should never change after first set
  @observable path

  constructor (props) {
    this.path = props.path
    this.clientId = md5(props.path)

    this.update(props)
  }

  update (props) {
    if (!props) return

    _.each(validProps, (prop) => {
      this._updateProp(props, prop)
    })
  }

  _updateProp (props, prop) {
    if (props[prop] != null) this[prop] = props[prop]
  }

  serialize () {
    return _.pick(this, persistentProps)
  }

  @computed get isValid () {
    return this.state === Project.VALID
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
        this.setChosenBrowser(this.defaultBrowser)
      }
    }
  }

  @action setChosenBrowser (browser) {
    _.each(this.browsers, (browser) => {
      browser.isChosen = false
    })
    localStorage.setItem('chosenBrowser', browser.name)
    browser.isChosen = true
  }

  @action setOnBoardingConfig (config) {
    this.isNew = config.isNewProject
    this.integrationExampleFile = config.integrationExampleFile
    this.integrationFolder = config.integrationFolder
    this.parentTestsFolderDisplay = config.parentTestsFolderDisplay
    this.fileServerFolder = config.fileServerFolder
    this.integrationExampleName = config.integrationExampleName
  }

  @action setResolvedConfig (resolved) {
    this.resolvedConfig = resolved
  }

  @action setError (err) {
    this.error = err
  }

  setChosenBrowserByName (name) {
    const browser = _.find(this.browsers, { name })
    this.setChosenBrowser(browser)
  }

  @action clearError () {
    this.error = undefined
  }
}
