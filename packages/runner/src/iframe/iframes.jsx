import Promise from 'bluebird'
import cs from 'classnames'
import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { $ } from '@packages/driver'

import AutIframe from './aut-iframe'
import ScriptError from '../errors/script-error'
import SnapshotControls from './snapshot-controls'

import eventManager from '../lib/event-manager'
import IframeModel from './iframe-model'
import logger from '../lib/logger'
import selectorHelperModel from '../selector-helper/selector-helper-model'
import windowUtil from '../lib/window-util'

@observer
export default class Iframes extends Component {
  _disposers = []

  render () {
    const { width, height, scale, marginLeft, headerHeight, scriptError } = this.props.state

    return (
      <div
        className={cs('iframes-container', { 'has-error': !!scriptError })}
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
        <ScriptError error={scriptError} />
        <div className='cover' />
      </div>
    )
  }

  componentDidMount () {
    const specPath = windowUtil.specPath()

    this.autIframe = new AutIframe(this.props.config)

    eventManager.on('visit:failed', this.autIframe.showVisitFailure)
    eventManager.on('script:error', this._setScriptError)

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    eventManager.on('restart', () => {
      this._run(this.props.config, specPath)
    })

    eventManager.on('print:selector:elements:to:console', this._printSelectorElementsToConsole)

    this._disposers.push(autorun(() => {
      this.autIframe.toggleSelectorHelper(selectorHelperModel.isEnabled)
    }))

    this._disposers.push(autorun(() => {
      this.autIframe.toggleSelectorHighlight(selectorHelperModel.isShowingHighlight)
    }))

    eventManager.start(this.props.config, specPath)

    this.iframeModel = new IframeModel({
      state: this.props.state,
      removeHeadStyles: this.autIframe.removeHeadStyles,
      restoreDom: this.autIframe.restoreDom,
      highlightEl: this.autIframe.highlightEl,
      detachDom: () => {
        const Cypress = eventManager.getCypress()
        if (Cypress) {
          return this.autIframe.detachDom(Cypress)
        }
      },
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
    this._run(this.props.config, specPath)
  }

  @action _setScriptError = (err) => {
    this.props.state.scriptError = err
  }

  _run = (config, specPath) => {
    this.props.eventManager.notifyRunningSpec(specPath)
    logger.clearLog()
    this._setScriptError(null)

    eventManager.setup(config, specPath)

    this._loadIframes(specPath)
    .then(($autIframe) => {
      eventManager.initialize($autIframe, config)
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
        resolve($autIframe)
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

  componentDidUpdate () {
    const cb = this.props.state.callbackAfterUpdate

    if (cb) {
      cb()
    }
  }

  _printSelectorElementsToConsole = () => {
    this.autIframe.printSelectorElementsToConsole()
  }

  componentWillUnmount () {
    this.props.eventManager.notifyRunningSpec(null)
    eventManager.stop()
    this._disposers.forEach((dispose) => {
      dispose()
    })
  }
}
