import _ from 'lodash'
import { action } from 'mobx'
import runner from '../lib/runner'

export default class IframeModel {
  constructor (state, { detachDom, removeHeadStyles, restoreDom, highlightEl }) {
    this.state = state
    this.detachDom = detachDom
    this.removeHeadStyles = removeHeadStyles
    this.restoreDom = restoreDom
    this.highlightEl = highlightEl

    this.detachedId = null
    this.intervalId = null
    this.originalState = null
  }

  listen () {
    runner.on('run:start', action('run:start', this._beforeRun))
    runner.on('run:end', action('run:start', this._afterRun))

    runner.on('viewport', action('viewport', this._updateViewport))
    runner.on('config', action('config', (config) => {
      this._updateViewport(_.map(config, 'viewportHeight', 'viewportWidth'))
    }))

    runner.on('url:changed', action('url:changed', this._updateUrl))
    runner.on('page:loading', action('page:loading', this._updateLoading))

    runner.on('show:snapshot', action('show:snapshot', this._setSnapshots))
    runner.on('hide:snapshot', action('hide:snapshot', this._clearSnapshots))
  }

  _beforeRun = () => {
    this.state.isRunning = true
  }

  _afterRun = () => {
    this.state.isRunning = false
  }

  _updateViewport = ({ viewportWidth, viewportHeight }) => {
    this.state.updateDimensions(viewportWidth, viewportHeight)
  }

  _updateUrl = (url) => {
    this.state.url = url
  }

  _updateLoading = (loading) => {
    this.state.loading = loading
  }

  _clearMessage = () => {
    this.state.clearMessage()
  }

  _setSnapshots = (snapshotProps) => {
    if (this.state.isRunning) {
      return this._testsRunningError()
    }

    const { snapshots } = snapshotProps

    if (!snapshots) {
      this._clearSnapshots()
      this.state.messageTitle = 'The snapshot is missing. Displaying current state of the DOM.'
      this.state.messageType = 'warning'
      return
    }

    this.state.highlightUrl = true

    if (!this.originalState) {
      this._storeOriginalState()
    }

    this.detachedId = snapshotProps.id

    this._updateViewport(snapshotProps)
    this._updateUrl(snapshotProps.url)

    clearInterval(this.intervalId)

    const revert = action('revert:snapshot', (snapshot) => {
      this.state.messageTitle = 'DOM Snapshot'
      this.state.messageDescription = snapshot.name
      this.state.messageType = ''

      this.restoreDom(snapshot.state, snapshot.htmlClasses)

      if (snapshotProps.$el) {
        const options = _.pick(snapshotProps, 'coords', 'highlightAttr', 'scrollBy')
        options.dom = snapshot.state
        this.highlightEl(snapshotProps.$el, options)
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

  _clearSnapshots = () => {
    clearInterval(this.intervalId)

    this.state.highlightUrl = false

    if (!this.originalState || !this.originalState.body) {
      return this._clearMessage()
    }

    const previousDetachedId = this.detachedId

    // process on next tick so we don't restore the dom if we're
    // about to receive another 'show:snapshot' event, else that would
    // be a huge waste
    setTimeout(action('clear:snapshots:next:tick', () => {
      // we want to only restore the dom if we haven't received
      // another snapshot by the time this function runs
      if (previousDetachedId !== this.detachedId) return

      this._updateViewport(this.originalState)
      this._updateUrl(this.originalState.url)
      this.restoreDom(this.originalState.body, this.originalState.htmlClasses)
      this._clearMessage()

      this.originalState = null
      this.detachedId = null
    }))
  }

  _testsRunningError () {
    this.state.messageTitle = 'Cannot show Snapshot while tests are running'
    this.state.messageType = 'warning'
  }

  _storeOriginalState () {
    const { body, htmlClasses } = this.detachDom()

    this.originalState = {
      body,
      htmlClasses,
      url: this.state.url,
      viewportWidth: this.state.width,
      viewportHeight: this.state.height,
    }

    this.removeHeadStyles()
  }
}
