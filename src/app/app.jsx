/* global $ */

import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import Reporter from '@cypress/core-reporter'

import windowUtil from '../lib/window-util'
import State from '../lib/state'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import NoSpec from './no-spec'
import RunnerWrap from './runner-wrap'

@observer
class App extends Component {
  render () {
    if (!windowUtil.hasSpecFile()) return <NoSpec onHashChange={this._checkSpecFile} />

    return (
      <div>
        <Reporter
          ref='reporter'
          runner={this.props.runner}
          specPath={this._specPath()}
        />
        <RunnerWrap
          className='container'
          style={{ left: this.props.state.reporterWidth }}
        >
          <Header ref='header' {...this.props} />
          <Iframes {...this.props} />
          <Message {...this.props} />
          {this.props.children}
        </RunnerWrap>
      </div>
    )
  }

  componentDidMount () {
    this._monitorWindowResize()
  }

  _checkSpecFile = () => {
    if (windowUtil.hasSpecFile()) {
      this.forceUpdate()
    }
  }

  _specPath () {
    return `${this.props.config.integrationFolder}/${windowUtil.specFile()}`
  }

  _monitorWindowResize () {
    const state = this.props.state

    const $window = $(window)
    const $header = $(findDOMNode(this.refs.header))
    const $reporter = $(findDOMNode(this.refs.reporter))

    $window.on('resize', action('window:resize', () => {
      state.updateWindowDimensions({
        windowWidth: $window.width(),
        windowHeight: $window.height(),
        reporterWidth: $reporter.outerWidth(),
        headerHeight: $header.outerHeight(),
      })
    })).trigger('resize')
  }
}

App.propTypes = {
  config: PropTypes.shape({
    browsers: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      majorVersion: PropTypes.string.isRequired,
      version: PropTypes.string.isRequired,
    })).isRequired,
    env: PropTypes.string.isRequired,
    integrationFolder: PropTypes.string.isRequired,
    numTestsKeptInMemory: PropTypes.number.isRequired,
    projectName: PropTypes.string.isRequired,
    viewportHeight: PropTypes.number.isRequired,
    viewportWidth: PropTypes.number.isRequired,
  }).isRequired,
  runner: PropTypes.shape({
    emit: PropTypes.func.isRequired,
    on: PropTypes.func.isRequired,
  }).isRequired,
  state: PropTypes.instanceOf(State).isRequired,
}

export default App
