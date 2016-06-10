import _ from 'lodash'
import { action } from 'mobx'
import runner from '../lib/runner'

export default class IframeModel {
  constructor (state, { detachBody, setBody, highlightEl }) {
    this.state = state
    this.detachBody = detachBody
    this.setBody = setBody
    this.highlightEl = highlightEl

    this.detachedId = null
    this.intervalId = null
    this.originalState = null
  }

  listen () {
    runner.on('run:start', this._beforeRun)
    runner.on('run:end', this._afterRun)

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

    runner.on('show:snapshot', this._setSnapshots)
    runner.on('hide:snapshot', this._clearSnapshots)
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

  @action _clearMessage = () => {
    this.state.clearMessage()
  }

  @action _setSnapshots = (snapshots, log) => {
    if (this.state.isRunning) {
      return this._testsRunningError()
    }

    if (!snapshots) {
      return this._clearSnapshots()
    }

    if (!this.originalState) {
      this._storeOriginalState()
    }

    this.detachedId = log.cid

    this._updateViewport(log)
    this._updateUrl(log.url)

    clearInterval(this.intervalId)

    const revert = action((snapshot) => {
      this.state.messageTitle = 'DOM Snapshot'
      this.state.messageDescription = snapshot.name
      this.state.messageType = ''

      this.setBody(snapshot.state)

      if (log.$el) {
        const options = _.pick(log, 'coords', 'highlightAttr', 'scrollBy')
        options.dom = snapshot.state
        this.highlightEl(log.$el, options)
      }
    })

    if (snapshots.length > 1) {
      let i = 0
      this.intervalId = setInterval(() => {
        i += 1
        if (!snapshots[i]) {
          i = 0
        }

        revert(snapshots[i])
      }, 800)
    }

    revert(snapshots[0])
  }

  @action _clearSnapshots = () => {
    clearInterval(this.intervalId)

    if (!this.originalState || !this.originalState.body) {
      return this._clearMessage()
    }

    const previousDetachedId = this.detachedId

    // process on next tick so we don't restore the dom if we're
    // about to receive another 'show:snapshot' event, else that would
    // be a huge waste
    setTimeout(() => {
      // we want to only restore the dom if we haven't received
      // another snapshot by the time this function runs
      if (previousDetachedId !== this.detachedId) return

      this._updateViewport(this.originalState)
      this._updateUrl(this.originalState.url)
      this.setBody(this.originalState.body)
      this._clearMessage()

      this.originalState = null
      this.detachedId = null
    })
  }

  _testsRunningError () {
    this.state.messageTitle = 'Cannot show Snapshot while tests are running'
    this.state.messageType = 'warning'
  }

  _storeOriginalState () {
    this.originalState = {
      body: this.detachBody(),
      url: this.state.url,
      viewportWidth: this.state.width,
      viewportHeight: this.state.height,
    }
  }
}
