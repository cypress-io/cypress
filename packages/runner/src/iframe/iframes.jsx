import cs from 'classnames'
import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { $ } from '@packages/driver'
import {
  SnapshotControls,
  ScriptError,
  IframeModel,
  selectorPlaygroundModel,
  AutIframe,
  logger,
  studioRecorder,
} from '@packages/runner-shared'

import util from '../lib/util'

@observer
export default class Iframes extends Component {
  _disposers = []

  render () {
    const { width, height, scale, marginLeft, headerHeight, scriptError } = this.props.state

    return (
      <div
        className={cs(
          'iframes-container',
          {
            'has-error': !!scriptError,
            'studio-is-open': studioRecorder.isOpen,
            'studio-is-loading': studioRecorder.isLoading,
            'studio-is-ready': studioRecorder.isReady,
            'studio-is-failed': studioRecorder.isFailed,
          },
        )}
        style={{
          top: headerHeight,
          left: this.props.state.absoluteReporterWidth + this.props.state.specListWidth,
        }}
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
        {studioRecorder.isLoading && (
          <div
            className='studio-loading-cover'
            style={{
              marginLeft,
              height,
              transform: `scale(${scale})`,
              width,
            }}
          >
            <div><i className='fa fa-spinner fa-spin' /></div>
          </div>
        )}
      </div>
    )
  }

  componentDidMount () {
    this.autIframe = new AutIframe(this.props.config)

    this.props.eventManager.on('visit:failed', this.autIframe.showVisitFailure)
    this.props.eventManager.on('before:screenshot', this.autIframe.beforeScreenshot)
    this.props.eventManager.on('after:screenshot', this.autIframe.afterScreenshot)
    this.props.eventManager.on('script:error', this._setScriptError)

    this.props.eventManager.on('run:end', this.autIframe.startStudio)
    this.props.eventManager.on('page:loading', (isLoading) => {
      if (!isLoading) {
        this.autIframe.reattachStudio()
      }
    })

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    this.props.eventManager.on('restart', () => {
      this._run(this.props.config)
    })

    this.props.eventManager.on('print:selector:elements:to:console', this._printSelectorElementsToConsole)

    this._disposers.push(autorun(() => {
      this.autIframe.toggleSelectorPlayground(selectorPlaygroundModel.isEnabled)
    }))

    this._disposers.push(autorun(() => {
      this.autIframe.toggleSelectorHighlight(selectorPlaygroundModel.isShowingHighlight)
    }))

    this.props.eventManager.start(this.props.config)

    this.iframeModel = new IframeModel({
      state: this.props.state,
      restoreDom: this.autIframe.restoreDom,
      highlightEl: this.autIframe.highlightEl,
      detachDom: this.autIframe.detachDom,
      snapshotControls: (snapshotProps) => (
        <SnapshotControls
          eventManager={this.props.eventManager}
          snapshotProps={snapshotProps}
          state={this.props.state}
          onToggleHighlights={this._toggleSnapshotHighlights}
          onStateChange={this._changeSnapshotState}
        />
      ),
    })

    this.iframeModel.listen()
    this._run(this.props.config)
  }

  @action _setScriptError = (err) => {
    if (err && 'error' in err) {
      this.props.state.scriptError = err.error
    }

    if (!err) {
      this.props.state.scriptError = null
    }
  }

  _run = (config) => {
    const specPath = util.specPath()

    this.props.eventManager.notifyRunningSpec(specPath)
    logger.clearLog()
    this._setScriptError(null)

    this.props.eventManager.setup(config)

    const $autIframe = this._loadIframes(specPath)

    this.props.eventManager.initialize($autIframe, config)
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  _loadIframes (specPath) {
    const specSrc = `/${this.props.config.namespace}/iframes/${specPath}`
    const $container = $(this.refs.container).empty()
    const $autIframe = this.autIframe.create(this.props.config).appendTo($container)

    this.autIframe.showBlankContents()

    const $specIframe = $('<iframe />', {
      id: `Your Spec: '${specSrc}'`,
      class: 'spec-iframe',
    }).appendTo($container)

    $specIframe.prop('src', specSrc)

    return $autIframe
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
    this.props.eventManager.stop()
    this._disposers.forEach((dispose) => {
      dispose()
    })
  }

  getSizeContainer () {
    return this.refs.container
  }
}
