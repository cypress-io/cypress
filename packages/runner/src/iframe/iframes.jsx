import cs from 'classnames'
import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import $Cypress from '@packages/driver'
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

const $ = $Cypress.$

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
    this.props.eventManager.on('script:error', this._setScriptError)
    this.props.eventManager.on('visit:blank', this.autIframe.visitBlank)

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

    this.props.eventManager.on('expect:origin', this._addCrossOriginIframe)

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
      isAUTSameOrigin: this.autIframe.doesAUTMatchTopOriginPolicy,
      removeSrc: this.autIframe.removeSrcAttributeFromAUTIframe,
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
    const specSrc = `/${this.props.config.namespace}/iframes/${encodeURIComponent(specPath)}`
    const $container = $(this.refs.container).empty()
    const $autIframe = this.autIframe.create(this.props.config).appendTo($container)

    // Remove the spec bridge iframe
    $('iframe.spec-bridge-iframe').remove()

    this.autIframe.showInitialBlankContents()

    this._addIframe({
      $container,
      id: `Your Spec: ${specSrc}`,
      className: 'spec-iframe',
      src: specSrc,
    })

    return $autIframe
  }

  _addCrossOriginIframe = (location) => {
    const id = `Spec Bridge: ${location.originPolicy}`

    // if it already exists, don't add another one
    if (document.getElementById(id)) {
      this.props.eventManager.notifyCrossOriginBridgeReady(location.originPolicy)

      return
    }

    this._addIframe({
      id,
      // the cross origin iframe is added to the document body instead of the
      // container since it needs to match the size of the top window for screenshots
      $container: $(document.body),
      className: 'spec-bridge-iframe',
      src: `${location.originPolicy}/${this.props.config.namespace}/multi-domain-iframes`,
    })
  }

  _addIframe ({ $container, id, src, className }) {
    const $specIframe = $('<iframe />', {
      id,
      class: className,
    }).appendTo($container)

    $specIframe.prop('src', src)
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

    // call the clientWidth to force the browser to repaint for viewport changes
    // otherwise firefox may fail when changing the viewport in between origins
    this.refs.container.clientWidth

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
