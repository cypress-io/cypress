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

import SpecsList from '../specs/specs-list'
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
    const { spec } = this.props.state

    // debugger

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
          {this._renderReporter(spec)}
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
  }

  _renderSpecs () {
    return <SpecsList state={this.props.state} />
  }

  _renderReporter (spec) {
    const NO_COMMAND_LOG = this.props.config.env && this.props.config.env.NO_COMMAND_LOG

    if (NO_COMMAND_LOG) {
      return null
    }

    // only render the inner reporter if we have a spec
    return (
      <>
        <div
          className="specs-wrapper"
          style={{
            position: 'absolute',
            width: '50%',
            height: '100%',
            borderRight: '1px solid #ddd',
            boxSizing: 'border-box',
          }}>
          {this._renderSpecs()}
        </div>
        <div style={{
          position: 'absolute',
          left: '50%',
          right: 0,
          top: 0,
          bottom: 0,
        }}>
          {this.props.state.spec && (
            <Reporter
              runMode={this.props.state.runMode}
              runner={this.props.eventManager.reporterBus}
              spec={this.props.state.spec}
              allSpecs={this.props.state.multiSpecs}
              autoScrollingEnabled={this.props.config.state.autoScrollingEnabled}
              error={errorMessages.reporterError(this.props.state.scriptError, spec.relative)}
              firefoxGcInterval={this.props.config.firefoxGcInterval}
              resetStatsOnSpecChange={this.props.state.runMode === 'single'}
            />
          )}
        </div>
      </>
    )
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

  componentWillUnmount () {
    $(this.props.window).off('resize', this._onWindowResize)
  }
}

App.defaultProps = {
  window,
  util,
}

App.propTypes = {
  runMode: PropTypes.oneOf(['single', 'multi']),
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
