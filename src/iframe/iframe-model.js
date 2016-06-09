import _ from 'lodash'
import { action } from 'mobx'
import runner from '../lib/runner'

export default class IframeModel {
  constructor (state) {
    this.state = state
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
    this.state.reset()
  }

  stopListening () {
    // TODO: tear down listeners
  }

  @action _beforeRun = () => {
    this.state.reset()
    this.state.isRunning = true
  }

  @action _afterRun = () => {
    this.state.isRunning = false
  }

  @action _updateViewport = (viewport) => {
    this.state.width = viewport.viewportWidth
    this.state.height = viewport.viewportHeight
  }

  @action _updateUrl = (url) => {
    this.state.url = url
  }

  @action _updateLoading = (loading) => {
    this.state.loading = loading
  }
}
