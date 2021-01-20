import cs from 'classnames'
import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import * as ReactDomExperimental from 'react-dom'
import { $ } from '@packages/driver'
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend'
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import { render } from '../plugins/react-devtools/ReactDevtools'

import AutIframe from './aut-iframe'
import ScriptError from '../errors/script-error'
import SnapshotControls from './snapshot-controls'

import IframeModel from './iframe-model'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'
import './iframes.scss'

export function getSpecUrl ({ namespace, spec }, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.relative}` : ''
}

@observer
export default class Iframes extends Component {
  _disposers = []
  maxWidth

  constructor (props) {
    super(props)
    this.maxWidth = this.props.state.width
  }

  render () {
    const { height, scriptError } = this.props.state

    return (
      <div>
        <div
          ref={this.props.setContainerRef}
          className='size-container'
          style={{
            height,
            maxWidth: this.maxWidth,
          }}
        />
        <ScriptError error={scriptError} />
        <div className='cover' />

        <div ref="devtoolsContainer" className="devtools-container" />
      </div>
    )
  }

  componentDidMount () {
    const config = this.props.config

    this.autIframe = new AutIframe(config)
    this.devtoolsRoot = ReactDomExperimental.unstable_createRoot(this.refs.devtoolsContainer)

    this.props.eventManager.on('visit:failed', this.autIframe.showVisitFailure)
    this.props.eventManager.on('before:screenshot', this.autIframe.beforeScreenshot)
    this.props.eventManager.on('after:screenshot', this.autIframe.afterScreenshot)
    this.props.eventManager.on('script:error', this._setScriptError)

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    this.props.eventManager.on('restart', () => {
      this._run(this.props.state.spec, config)
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
      removeHeadStyles: this.autIframe.removeHeadStyles,
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

    this._disposers.push(autorun(() => {
      const spec = this.props.state.spec

      if (spec) {
        this._run(spec, config)
      }
    }))
  }

  @action _setScriptError = (err) => {
    this.props.state.scriptError = err
  }

  _run = (spec, config) => {
    config.spec = spec

    // this.props.eventManager.notifyRunningSpec(specPath)
    // logger.clearLog()
    this._setScriptError(null)

    this.props.eventManager.setup(config)

    const $autIframe = this._loadIframes(spec)

    this._activateDevtools($autIframe)
    this.props.eventManager.initialize($autIframe, config)
  }

  _activateDevtools = (autFrame) => {
    const activateDevtools = (contentWindow) => {
      initializeBackend(contentWindow)
      const DevTools = initializeFrontend(contentWindow)

      activateBackend(contentWindow)

      this.devtoolsRoot?.render(<DevTools browserTheme="dark" />)
    }

    const contentWindow = autFrame.prop('contentWindow')

    autFrame[0].onload = () => {
      activateDevtools(contentWindow)
    }
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  _loadIframes (spec) {
    const specSrc = getSpecUrl({ namespace: this.props.config.namespace, spec })
    const $container = $(this.props.containerRef).empty()
    const $autIframe = this.autIframe.create().appendTo($container)

    this.autIframe.showBlankContents()

    // In mount mode we need to render something right from spec file
    // So load application tests to the aut frame
    $autIframe.prop('src', specSrc)

    return $autIframe

    // const $specIframe = $('<iframe />', {
    //   id: `Your Spec: '${specSrc}'`,
    //   class: 'spec-iframe',
    // }).appendTo($container)

    // $specIframe.prop('src', specSrc)

    // return $autIframe
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
