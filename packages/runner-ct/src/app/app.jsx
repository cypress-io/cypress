import cs from 'classnames'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { Reporter } from '@packages/reporter'
import { $ } from '@packages/driver'

import errorMessages from '../errors/error-messages'
import util from '../lib/util'
import State from '../lib/state'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import Resizer from './resizer'

@observer
class App extends Component {
  @observable isReporterResizing = false

  render () {
    /**
     * @type {Cypress.Cypress['spec']}
     */
    const spec = this.props.config.spec

    const NO_COMMAND_LOG = this.props.config.env && this.props.config.env.NO_COMMAND_LOG

    return (
      <div className={cs({
        'is-reporter-resizing': this.isReporterResizing,
        'is-reporter-sized': this.props.state.reporterWidth != null,
      })}>
        <div
          ref='reporterWrap'
          className='reporter-wrap'
          style={{ width: this.props.state.reporterWidth }}
        >
          {Boolean(NO_COMMAND_LOG) || <Reporter
            runner={this.props.eventManager.reporterBus}
            spec={spec}
            autoScrollingEnabled={this.props.config.state.autoScrollingEnabled}
            error={errorMessages.reporterError(this.props.state.scriptError, spec.relative)}
            firefoxGcInterval={this.props.config.firefoxGcInterval}
          />}
        </div>
        <div
          ref='container'
          className='runner container'
          style={{ left: this.props.state.absoluteReporterWidth }}
        >
          <Header ref='header' {...this.props} />
          <Iframes ref='iframes' {...this.props} />
          <Message ref='message' state={this.props.state} />
          {this.props.children}
        </div>
        <Resizer
          style={{ left: this.props.state.absoluteReporterWidth }}
          state={this.props.state}
          onResizeStart={this._onReporterResizeStart}
          onResize={this._onReporterResize}
          onResizeEnd={this._onReporterResizeEnd}
        />
        {/* these pixels help ensure the browser has painted when taking a screenshot */}
        <div ref='screenshotHelperPixels' className='screenshot-helper-pixels'>
          <div /><div /><div /><div /><div /><div />
        </div>
      </div>
    )
  }

  componentDidMount () {
    this._monitorWindowResize()
    this._handleScreenshots()
  }

  _monitorWindowResize () {
    const state = this.props.state
    const win = this.props.window

    const $header = $(findDOMNode(this.refs.header))
    const $reporterWrap = $(this.refs.reporterWrap)

    this._onWindowResize = () => {
      state.updateWindowDimensions({
        windowWidth: win.innerWidth,
        windowHeight: win.innerHeight,
        reporterWidth: $reporterWrap.outerWidth(),
        headerHeight: $header.outerHeight(),
      })
    }

    $(win).on('resize', this._onWindowResize).trigger('resize')
  }

  _onReporterResizeStart = () => {
    this.isReporterResizing = true
  }

  _onReporterResize = (reporterWidth) => {
    this.props.state.reporterWidth = reporterWidth
    this.props.state.absoluteReporterWidth = reporterWidth

    const $header = $(findDOMNode(this.refs.header))

    this.props.state.updateWindowDimensions({
      headerHeight: $header.outerHeight(),
    })
  }

  _onReporterResizeEnd = () => {
    this.isReporterResizing = false
    this.props.eventManager.saveState({
      reporterWidth: this.props.state.reporterWidth,
    })
  }

  _handleScreenshots () {
    const containerNode = findDOMNode(this.refs.container)
    const reporterNode = this.refs.reporterWrap
    const headerNode = findDOMNode(this.refs.header)
    const iframesNode = findDOMNode(this.refs.iframes)
    const iframesSizeNode = findDOMNode(this.refs.iframes.getSizeContainer())
    const screenshotHelperPixels = this.refs.screenshotHelperPixels

    let prevAttrs = {}
    let screenshotting = false

    const { eventManager } = this.props

    eventManager.on('before:screenshot', (config) => {
      if (!config.appOnly) return

      screenshotting = true

      prevAttrs = {
        config,
        top: iframesNode.style.top,
        marginLeft: iframesSizeNode.style.marginLeft,
        width: iframesSizeNode.style.width,
        height: iframesSizeNode.style.height,
        transform: iframesSizeNode.style.transform,
        left: containerNode.style.left,
      }

      const messageNode = findDOMNode(this.refs.message)

      if (messageNode) {
        messageNode.style.display = 'none'
      }

      reporterNode.style.display = 'none'
      headerNode.style.display = 'none'

      iframesNode.style.top = 0
      iframesNode.style.backgroundColor = 'black'
      iframesSizeNode.style.marginLeft = 0

      containerNode.style.left = 0
      iframesNode.style.left = 0

      containerNode.className += ' screenshotting'

      if (!config.scale) {
        iframesSizeNode.style.width = `${Math.min(window.innerWidth, iframesSizeNode.offsetWidth)}px`
        iframesSizeNode.style.height = `${Math.min(window.innerHeight, iframesSizeNode.offsetHeight)}px`
        iframesSizeNode.style.transform = null
      }

      screenshotHelperPixels.style.display = 'none'
    })

    const afterScreenshot = (config) => {
      if (!config.appOnly) return

      screenshotting = false

      screenshotHelperPixels.style.display = 'block'

      containerNode.className = containerNode.className.replace(' screenshotting', '')
      containerNode.style.left = prevAttrs.left
      iframesNode.style.left = prevAttrs.left

      iframesNode.style.top = prevAttrs.top
      iframesNode.style.backgroundColor = null
      iframesSizeNode.style.marginLeft = prevAttrs.marginLeft

      reporterNode.style.display = null
      headerNode.style.display = null

      const messageNode = findDOMNode(this.refs.message)

      if (messageNode) {
        messageNode.style.display = null
      }

      if (!config.scale) {
        iframesSizeNode.style.transform = prevAttrs.transform
        iframesSizeNode.style.width = prevAttrs.width
        iframesSizeNode.style.height = prevAttrs.height
      }

      prevAttrs = {}
    }

    eventManager.on('after:screenshot', afterScreenshot)

    eventManager.on('run:start', () => {
      if (screenshotting) {
        afterScreenshot(prevAttrs.config)
      }
    })
  }

  componentWillUnmount () {
    $(this.props.window).off('resize', this._onWindowResize)
  }
}

App.defaultProps = {
  window,
  util,
}

App.propTypes = {
  config: PropTypes.shape({
    browsers: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      majorVersion: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      version: PropTypes.string.isRequired,
    })).isRequired,
    integrationFolder: PropTypes.string.isRequired,
    numTestsKeptInMemory: PropTypes.number.isRequired,
    projectName: PropTypes.string.isRequired,
    viewportHeight: PropTypes.number.isRequired,
    viewportWidth: PropTypes.number.isRequired,
  }).isRequired,
  eventManager: PropTypes.shape({
    notifyRunningSpec: PropTypes.func.isRequired,
    reporterBus: PropTypes.shape({
      emit: PropTypes.func.isRequired,
      on: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  state: PropTypes.instanceOf(State).isRequired,
}

export default App
