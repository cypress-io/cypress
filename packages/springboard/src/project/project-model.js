import _ from 'lodash'
import { action, computed, observable, toJS } from 'mobx'

import Browser from '../lib/browser-model'
import Warning from './warning-model'

const cacheProps = [
  'id',
  'name',
  'public',
  'orgName',
  'orgId',
  'defaultOrg',
  'lastBuildStatus',
  'lastBuildCreatedAt',
]

const validProps = cacheProps.concat([
  'state',
  'isChosen',
  'isLoading',
  'isNew',
  'configFile',
  'browsers',
  'onBoardingModalOpen',
  'browserState',
  'resolvedConfig',
  'parentTestsFolderDisplay',
  'integrationExampleName',
  'scaffoldedFiles',
  'resolvedNodePath',
  'resolvedNodeVersion',
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
  @observable isChosen = false
  @observable isLoading = false
  @observable isNew = false
  @observable browsers = []
  @observable onBoardingModalOpen = false
  @observable browserState = 'closed'
  @observable resolvedConfig
  @observable error
  /** @type {{[key: string] : {warning:Error & {dismissed: boolean}}}} */
  @observable _warnings = {}
  @observable apiError
  @observable parentTestsFolderDisplay
  @observable integrationExampleName
  @observable scaffoldedFiles = []
  @observable resolvedNodePath
  @observable resolvedNodeVersion
  // should never change after first set
  @observable path
  // not observable
  dismissedWarnings = {}

  constructor (props) {
    this.path = props.path

    this.update(props)
  }

  @computed get displayName () {
    if (this.name) return this.name

    // need normalize windows paths with \ before split
    const normalizedPath = this.path.replace(/\\/g, '/')
    const lastDir = _.last(normalizedPath.split('/'))

    return _.truncate(lastDir, { length: 60 })
  }

  @computed get displayPath () {
    const maxPathLength = 45

    if (this.path.length <= maxPathLength) return this.path

    const truncatedPath = this.path.slice((this.path.length - 1) - maxPathLength, this.path.length)

    return '...'.concat(truncatedPath)
  }

  @computed get isUnauthorized () {
    return this.state === Project.UNAUTHORIZED
  }

  @computed get isValid () {
    return this.state === Project.VALID
  }

  @computed get isInvalid () {
    return this.state === Project.INVALID
  }

  @computed get isSetupForRecording () {
    return this.id && this.isValid
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

  @computed get warnings () {
    return _.reject(this._warnings, { isDismissed: true })
  }

  @action update (props) {
    if (!props) return

    _.each(validProps, (prop) => {
      this._updateProp(props, prop)
    })
  }

  _updateProp (props, prop) {
    if (props[prop] != null) this[prop] = props[prop]
  }

  @action setLoading (isLoading) {
    this.isLoading = isLoading
  }

  @action openModal () {
    this.onBoardingModalOpen = true
  }

  @action closeModal () {
    this.onBoardingModalOpen = false
  }

  @action browserOpening () {
    this.browserState = 'opening'
  }

  @action browserOpened () {
    this.browserState = 'opened'
  }

  @action browserClosed () {
    this.browserState = 'closed'
  }

  @action setBrowsers (browsers = []) {
    if (browsers.length) {
      this.browsers = _.map(browsers, (browser) => {
        return new Browser(browser)
      })

      // use a custom browser if one is supplied. or, if they already have
      // a browser chosen that's been saved in localStorage, then select that
      // otherwise just do the default.
      const customBrowser = _.find(this.browsers, { custom: true })

      if (customBrowser) {
        return this.setChosenBrowser(customBrowser, { save: false })
      }

      const ls = localStorage.getItem('chosenBrowser')

      if (ls) {
        return this.setChosenBrowserFromLocalStorage(ls)
      }

      return this.setChosenBrowser(this.defaultBrowser)
    }
  }

  @action setChosenBrowser (browser, { save } = {}) {
    _.each(this.browsers, (browser) => {
      browser.isChosen = false
    })

    if (save !== false) {
      localStorage.setItem('chosenBrowser', JSON.stringify(_.pick(browser, 'name', 'channel')))
    }

    browser.isChosen = true
  }

  @action setOnBoardingConfig (config) {
    this.isNew = config.isNewProject
    this.integrationFolder = config.integrationFolder
    this.parentTestsFolderDisplay = config.parentTestsFolderDisplay
    this.fileServerFolder = config.fileServerFolder
    this.integrationExampleName = config.integrationExampleName
    this.integrationExamplePath = config.integrationExamplePath
    this.scaffoldedFiles = config.scaffoldedFiles
  }

  @action setResolvedConfig (resolved) {
    this.resolvedConfig = resolved
  }

  @action setError (err = {}) {
    // for some reason, the original `stack` is unavailable on `err` once it is set on the model
    // `stack2` remains usable though, for some reason
    err.stack2 = err.stack
    this.error = err
  }

  @action clearError () {
    this.error = null
  }

  @action addWarning (warning) {
    const type = warning.type

    if (type && this._warnings[type] && this._warnings[type].isDismissed) {
      return
    }

    this._warnings[type] = new Warning(warning)
  }

  @action dismissWarning (warning) {
    if (!warning) {
      // calling with no warning clears all warnings
      return _.each(this._warnings, ((warning) => {
        return this.dismissWarning(warning)
      }))
    }

    warning.setDismissed(true)
  }

  @action setApiError = (err = {}) => {
    this.apiError = err
  }

  @action setChosenBrowserFromLocalStorage (ls) {
    let filter = {}

    try {
      _.merge(filter, JSON.parse(ls))
    } catch (err) {
      // localStorage pre-dates JSON filter, assume "name"
      filter.name = ls
    }

    const browser = _.find(this.browsers, filter) || this.defaultBrowser

    this.setChosenBrowser(browser)
  }

  clientDetails () {
    return _.pick(this, 'id', 'path')
  }

  getConfigValue (key) {
    if (!this.resolvedConfig) return

    return toJS(this.resolvedConfig[key]).value
  }

  serialize () {
    return _.pick(this, cacheProps)
  }
}
