import _ from 'lodash'
import { action } from 'mobx'
import Cypress from '../lib/cypress'

export default class IframeModel {
  constructor (uiState) {
    this.uiState = uiState
  }

  listen () {
    // @listenTo runner, "before:run", ->
    //   @initialize()
    //   @isRunning(true)

    // @listenTo runner, "after:run", ->
    //   @isRunning(false)

    Cypress.on('viewport', this._updateViewport)

    Cypress.on('config', (config) => {
      this._updateViewport(_.map(config, 'viewportHeight', 'viewportWidth'))
    })

    Cypress.on('stop', () => {
      this.reset()
      this.stopListening()
    })

    Cypress.on('url:changed', this._updateUrl)

    Cypress.on('page:loading', this._updateLoading)
  }

  reset () {
    this.uiState.reset()
  }

  stopListening () {
    // tear down listeners
  }

  @action _updateViewport = (viewport) => {
    this.uiState.width = viewport.viewportWidth
    this.uiState.height = viewport.viewportHeight
  }

  @action _updateUrl = (url) => {
    this.uiState.url = url
  }

  @action _updateLoading = (loading) => {
    this.uiState.loading = loading
  }
}
