import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { Reporter } from '@packages/reporter'
import { $ } from '@packages/driver'

import errorMessages from '../errors/error-messages'
import windowUtil from '../lib/window-util'
import State from '../lib/state'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import Resizer from './resizer'
import RunnerWrap from './runner-wrap'

@observer
class App extends Component {
  @observable isReporterResizing = false

  render () {
    const specPath = this._specPath()

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
          <Reporter
            runner={this.props.eventManager.reporterBus}
            specPath={specPath}
            autoScrollingEnabled={this.props.config.state.autoScrollingEnabled}
            error={errorMessages.reporterError(this.props.state.scriptError, specPath)}
          />
        </div>
        <RunnerWrap
          className='container'
          style={{ left: this.props.state.absoluteReporterWidth }}
        >
          <Header ref='header' {...this.props} />
          <Iframes {...this.props} />
          <Message state={this.props.state} />
          {this.props.children}
        </RunnerWrap>
        <Resizer
          style={{ left: this.props.state.absoluteReporterWidth }}
          state={this.props.state}
          onResizeStart={this._onReporterResizeStart}
          onResize={this._onReporterResize}
          onResizeEnd={this._onReporterResizeEnd}
        />
      </div>
    )
  }

  componentDidMount () {
    this._monitorWindowResize()
  }

  _specPath () {
    return `${this.props.config.integrationFolder}/${this.props.windowUtil.specFile()}`
  }

  _monitorWindowResize () {
    const state = this.props.state

    const $window = $(this.props.window)
    const $header = $(findDOMNode(this.refs.header))
    const $reporterWrap = $(this.refs.reporterWrap)

    this._onWindowResize = action('window:resize', () => {
      state.updateWindowDimensions({
        windowWidth: $window.width(),
        windowHeight: $window.height(),
        reporterWidth: $reporterWrap.outerWidth(),
        headerHeight: $header.outerHeight(),
      })
    })

    $window.on('resize', this._onWindowResize).trigger('resize')
  }

  _onReporterResizeStart = () => {
    this.isReporterResizing = true
  }

  _onReporterResize = (reporterWidth) => {
    this.props.state.reporterWidth = reporterWidth
    this.props.state.absoluteReporterWidth = reporterWidth
  }

  _onReporterResizeEnd = () => {
    this.isReporterResizing = false
    this.props.eventManager.saveState({
      reporterWidth: this.props.state.reporterWidth,
    })
  }

  componentWillUnmount () {
    $(this.props.window).off('resize', this._onWindowResize)
  }
}

App.defaultProps = {
  window,
  windowUtil,
}

App.propTypes = {
  config: PropTypes.shape({
    browsers: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      majorVersion: PropTypes.string.isRequired,
      version: PropTypes.string.isRequired,
    })).isRequired,
    cypressEnv: PropTypes.string.isRequired,
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
