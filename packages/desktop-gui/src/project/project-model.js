import _ from 'lodash'
import { action, computed, observable, toJS, makeObservable } from 'mobx'

import Browser from '../lib/browser-model'
import Warning from './warning-model'
import Prompts from '../prompts/prompts-model'

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
  id;
  name;
  public;
  lastBuildStatus;
  lastBuildCreatedAt;
  orgName;
  orgId;
  defaultOrg;
  // comes from ipc, but not persisted
  state = Project.VALID;
  // local state
  isChosen = false;
  isLoading = false;
  isNew = false;
  browsers = [];
  onBoardingModalOpen = false;
  browserState = 'closed';
  resolvedConfig;
  error;
  /** @type {{[key: string] : {warning:Error & {dismissed: boolean}}}} */
  _warnings = {};
  apiError;
  parentTestsFolderDisplay;
  integrationExampleName;
  scaffoldedFiles = [];
  resolvedNodePath;
  resolvedNodeVersion;
  // should never change after first set
  path;
  prompts = new Prompts();
  // not observable
  dismissedWarnings = {}

  constructor (props) {
    makeObservable(this, {
      id: observable,
      name: observable,
      public: observable,
      lastBuildStatus: observable,
      lastBuildCreatedAt: observable,
      orgName: observable,
      orgId: observable,
      defaultOrg: observable,
      state: observable,
      isChosen: observable,
      isLoading: observable,
      isNew: observable,
      browsers: observable,
      onBoardingModalOpen: observable,
      browserState: observable,
      resolvedConfig: observable,
      error: observable,
      _warnings: observable,
      apiError: observable,
      parentTestsFolderDisplay: observable,
      integrationExampleName: observable,
      scaffoldedFiles: observable,
      resolvedNodePath: observable,
      resolvedNodeVersion: observable,
      path: observable,
      prompts: observable,
      displayName: computed,
      displayPath: computed,
      isUnauthorized: computed,
      isValid: computed,
      isInvalid: computed,
      isSetupForRecording: computed,
      otherBrowsers: computed,
      chosenBrowser: computed,
      defaultBrowser: computed,
      warnings: computed,
      update: action,
      setLoading: action,
      openModal: action,
      closeModal: action,
      browserOpening: action,
      browserOpened: action,
      browserClosed: action,
      setBrowsers: action,
      setChosenBrowser: action,
      setOnBoardingConfig: action,
      setResolvedConfig: action,
      setError: action,
      clearError: action,
      addWarning: action,
      dismissWarning: action,
      setApiError: action,
      setChosenBrowserFromLocalStorage: action,
    })

    this.path = props.path

    this.update(props)
  }

  get displayName () {
    if (this.name) return this.name

    // need normalize windows paths with \ before split
    const normalizedPath = this.path.replace(/\\/g, '/')
    const lastDir = _.last(normalizedPath.split('/'))

    return _.truncate(lastDir, { length: 60 })
  }

  get displayPath () {
    const maxPathLength = 45

    if (this.path.length <= maxPathLength) return this.path

    const truncatedPath = this.path.slice((this.path.length - 1) - maxPathLength, this.path.length)

    return '...'.concat(truncatedPath)
  }

  get isUnauthorized () {
    return this.state === Project.UNAUTHORIZED
  }

  get isValid () {
    return this.state === Project.VALID
  }

  get isInvalid () {
    return this.state === Project.INVALID
  }

  get isSetupForRecording () {
    return this.id && this.isValid
  }

  get otherBrowsers () {
    return _.filter(this.browsers, { isChosen: false })
  }

  get chosenBrowser () {
    return _.find(this.browsers, { isChosen: true })
  }

  get defaultBrowser () {
    return this.browsers[0]
  }

  get warnings () {
    return _.reject(this._warnings, { isDismissed: true })
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

  setLoading (isLoading) {
    this.isLoading = isLoading
  }

  openModal () {
    this.onBoardingModalOpen = true
  }

  closeModal () {
    this.onBoardingModalOpen = false
  }

  browserOpening () {
    this.browserState = 'opening'
  }

  browserOpened () {
    this.browserState = 'opened'
  }

  browserClosed () {
    this.browserState = 'closed'
  }

  setBrowsers (browsers = []) {
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

  setChosenBrowser (browser, { save } = {}) {
    _.each(this.browsers, (browser) => {
      browser.isChosen = false
    })

    if (save !== false) {
      localStorage.setItem('chosenBrowser', JSON.stringify(_.pick(browser, 'name', 'channel')))
    }

    browser.isChosen = true
  }

  setOnBoardingConfig (config) {
    this.isNew = config.isNewProject
    this.integrationFolder = config.integrationFolder
    this.parentTestsFolderDisplay = config.parentTestsFolderDisplay
    this.fileServerFolder = config.fileServerFolder
    this.integrationExampleName = config.integrationExampleName
    this.integrationExamplePath = config.integrationExamplePath
    this.scaffoldedFiles = config.scaffoldedFiles
  }

  setResolvedConfig (resolved) {
    this.resolvedConfig = resolved
  }

  setError (err = {}) {
    // for some reason, the original `stack` is unavailable on `err` once it is set on the model
    // `stack2` remains usable though, for some reason
    err.stack2 = err.stack
    this.error = err
  }

  clearError () {
    this.error = null
  }

  addWarning (warning) {
    const type = warning.type

    if (type && this._warnings[type] && this._warnings[type].isDismissed) {
      return
    }

    this._warnings[type] = new Warning(warning)
  }

  dismissWarning (warning) {
    if (!warning) {
      // calling with no warning clears all warnings
      return _.each(this._warnings, ((warning) => {
        return this.dismissWarning(warning)
      }))
    }

    warning.setDismissed(true)
  }

  setApiError = (err = {}) => {
    this.apiError = err
  };

  setChosenBrowserFromLocalStorage (ls) {
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
