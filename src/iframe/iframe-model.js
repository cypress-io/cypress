import _ from 'lodash'
import { action } from 'mobx'
import runner from '../lib/runner'

export default class IframeModel {
  constructor (uiState) {
    this.uiState = uiState
  }

  listen () {
    runner.on('before:run', this._beforeRun)
    runner.on('after:run', this._afterRun)

    runner.on('viewport', this._updateViewport)
    runner.on('config', (config) => {
      this._updateViewport(_.map(config, 'viewportHeight', 'viewportWidth'))
    })

    runner.on('stop', () => {
      this.reset()
      this.stopListening()
    })

    runner.on('url:changed', this._updateUrl)
    runner.on('page:loading', this._updateLoading)
  }

  @action reset () {
    this.uiState.reset()
  }

  stopListening () {
    // TODO: tear down listeners
  }

  @action _beforeRun = () => {
    this.uiState.reset()
    this.uiState.isRunning = true
  }

  @action _afterRun = () => {
    this.uiState.isRunning = false
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
