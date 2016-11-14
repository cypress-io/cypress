/* global $ */

import Promise from 'bluebird'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import AutIframe from './aut-iframe'
import SnapshotControls from './snapshot-controls'

import IframeModel from './iframe-model'
import logger from '../lib/logger'
import eventManager from '../lib/event-manager'
import windowUtil from '../lib/window-util'

@observer
export default class Iframes extends Component {
  render () {
    const { width, height, scale, marginLeft, headerHeight } = this.props.state

    return (
      <div
        className='iframes-container'
        style={{ top: headerHeight }}
      >
        <div
          ref='container'
          className='size-container'
          style={{
            marginLeft,
            height,
            transform: `scale(${scale})`,
            width,
          }}
        />
        <div className='cover' />
      </div>
    )
  }

  componentDidMount () {
    this.autIframe = new AutIframe(this.props.config)

    eventManager.on('visit:failed', this.autIframe.showVisitFailure)
    eventManager.on('script:error', this._setScriptError)

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    eventManager.on('restart', this._run)

    eventManager.start(this.props.config)

    this.iframeModel = new IframeModel({
      state: this.props.state,
      detachDom: this.autIframe.detachDom,
      removeHeadStyles: this.autIframe.removeHeadStyles,
      restoreDom: this.autIframe.restoreDom,
      highlightEl: this.autIframe.highlightEl,
      snapshotControls: (snapshotProps) => (
        <SnapshotControls
          eventManager={eventManager}
          snapshotProps={snapshotProps}
          state={this.props.state}
          onToggleHighlights={this._toggleSnapshotHighlights}
          onStateChange={this._changeSnapshotState}
        />
      ),
    })
    this.iframeModel.listen()
    this._run()
  }

  @action _setScriptError = (err) => {
    this.props.state.scriptError = err
  }

  _run = () => {
    const specPath = windowUtil.specPath()
    this.props.eventManager.notifyRunningSpec(specPath)
    logger.clearLog()
    this._setScriptError(null)

    this._loadIframes(specPath)
    .then(([specWindow, $autIframe]) => {
      eventManager.run(specPath, specWindow, $autIframe)
    })
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  _loadIframes (specPath) {
    return new Promise((resolve) => {
      // TODO: config should have "iframeUrl": "/__cypress/iframes"
      const specSrc = `/${this.props.config.namespace}/iframes/${specPath}`

      const $container = $(this.refs.container).empty()
      const $autIframe = this.autIframe.create(this.props.config).appendTo($container)
      this.autIframe.showBlankContents()

      const $specIframe = $('<iframe />', {
        id: `Your Spec: '${specSrc}'`,
        class: 'spec-iframe',
      }).appendTo($container)

      $specIframe.prop('src', specSrc).one('load', () => {
        resolve([$specIframe[0].contentWindow, $autIframe])
      })
    })
  }

  _toggleSnapshotHighlights = (snapshotProps) => {
    this.props.state.snapshot.showingHighlights = !this.props.state.snapshot.showingHighlights

    if (this.props.state.snapshot.showingHighlights) {
      const snapshot = snapshotProps.snapshots[this.props.state.snapshot.stateIndex]
      this.autIframe.highlightEl(snapshot, snapshotProps)
    } else {
      this.autIframe.removeHighlights()
    }
  }

  _changeSnapshotState = (snapshotProps, index) => {
    const snapshot = snapshotProps.snapshots[index]
    this.props.state.snapshot.stateIndex = index
    this.autIframe.restoreDom(snapshot)

    if (this.props.state.snapshot.showingHighlights && snapshotProps.$el) {
      this.autIframe.highlightEl(snapshot, snapshotProps)
    } else {
      this.autIframe.removeHighlights()
    }
  }

  componentWillUnmount () {
    this.props.eventManager.notifyRunningSpec(null)
    eventManager.stop()
  }
}
