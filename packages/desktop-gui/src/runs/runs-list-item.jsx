import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import TimerDisplay from '../duration-timer/TimerDisplay'

import { osIcon, browserIcon, gravatarUrl, getStatusIcon, durationFormatted, browserVersionFormatted, stripLeadingCyDirs } from '../lib/utils'

export default class RunsListItem extends Component {
  render () {
    const run = this.props.run
    const NEWLINE = '\n'

    return (
      <li onClick={this._goToRun}>
        <div className={`row-column-wrapper ${run.status} status-data`}>
          <div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <Tooltip title={_.startCase(run.status)} className='cy-tooltip'>
              <i className={`fa ${run.status} fa-${getStatusIcon(run.status)}`}></i>
            </Tooltip>
            {' '}#{run.buildNumber}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-top-padding'>
            <div>
              { run.commitBranch ? run.commitBranch : null }
              {run.commitBranch && this._displaySpec() ? ' / ' : null}
              {this._displaySpec()}
            </div>
            <div className='msg'>
              {
                run.commitAuthorEmail ?
                  <img
                    className='user-avatar'
                    height='13'
                    width='13'
                    src={`${gravatarUrl(run.commitAuthorEmail)}`}
                  /> :
                  null
              }
              {
                run.commitMessage ?
                  <span className='commit-msg'>
                    {run.commitMessage.split(NEWLINE)[0]}
                  </span> :
                  null
              }
            </div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className='fa fa-clock-o'></i>{' '}
            {moment(run.createdAt).fromNow()}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            {
              run.duration ?
                <span>
                  <i className='fa fa-hourglass-end'></i>{' '}
                  {durationFormatted(run.duration)}
                </span> :
                run.startedAt ?
                  <TimerDisplay startTime={run.startedAt} /> :
                  null
            }
          </div>
        </div>
        <div className='row-column-wrapper env-data'>
          <div className='td-top-padding'>
            {/* // do we have multiple OS's ? */}
            {
              this._instancesExist() ?
                this._moreThanOneInstance() && this._osLength() > 1 ?
                  <div>
                    <i className='fa fa-fw fa-desktop'></i>{' '}
                    {this._osLength()} OSs
                  </div> :
                  // or did we only actual run it on one OS
                  <div>
                    <i className={`fa fa-fw fa-${osIcon(this.props.run.instances[0].osName)}`}></i>{' '}
                    {this._osDisplay()}
                  </div> :
                null
            }
            {/* // do we have multiple browsers ? */}
            {
              this._instancesExist() ?
                this._moreThanOneInstance() && this._browsersLength() > 1 ?
                  <div className='msg'>
                    <i className='fa fa-fw fa-globe'></i>{' '}
                    {this._browsersLength()} browsers
                  </div> :
                  // or did we only actual run it on one browser
                  <div className='msg'>
                    <i className={`fa fa-fw fa-${this._browserIcon()}`}></i>{' '}
                    {this._browserDisplay()}
                  </div> :
                null
            }
          </div>
        </div>
        <div className='row-column-wrapper passing-data'>
          {
            run.status !== 'running' ?
              <div className='result'>
                <i className='fa fa-check'></i>{' '}
                <span>
                  {run.passed ? run.passed : '0'}
                </span>
              </div> :
              null
          }
        </div>
        <div className='row-column-wrapper failure-data'>
          {
            run.status !== 'running' ?
              <div className='result'>
                <i className='fa fa-times'></i>{' '}
                <span>
                  {run.failed ? run.failed : '0'}
                </span>
              </div> :
              null
          }
        </div>
      </li>
    )
  }

  _moreThanOneInstance () {
    return (this.props.run.instances.length > 1)
  }

  _instancesExist () {
    return (!!this.props.run.instances.length)
  }

  _displaySpec () {
    // only display spec if we for sure have 1 instance
    if (!this._instancesExist() || this._moreThanOneInstance()) return null

    let spec = this.props.run.instances[0].spec

    if (!spec) return null

    return (
      <strong>{stripLeadingCyDirs(spec)}</strong>
    )
  }

  _getUniqBrowsers () {
    if (!this.props.run.instances) return 0

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${instance.browserName} + ${instance.browserVersion}`
    })
    .uniq()
    .value()
  }

  _browsersLength () {
    return this._getUniqBrowsers().length
  }

  _browserIcon () {
    return browserIcon(this.props.run.instances[0].browserName)
  }

  _osIcon () {
    if (!this._moreThanOneInstance() && this.props.run.instances.length) {
      return (osIcon(this.props.run.instances[0].osName))
    } else {
      return 'desktop'
    }
  }

  _getUniqOs () {
    if (!this.props.run.instances) return

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${instance.osName} + ${instance.osVersionFormatted}`
    })
    .uniq()
    .value()
  }

  _osLength () {
    return this._getUniqOs().length
  }

  _osDisplay = () => {
    if (this.props.run.instances && this.props.run.instances[0]) {
      return (
        <span>
          {this.props.run.instances[0].osVersionFormatted}
        </span>
      )
    }
  }

  _browserDisplay = () => {
    if (this.props.run.instances && this.props.run.instances[0]) {
      return (
        <span>
          {browserVersionFormatted(this.props.run.instances[0].browserVersion)}
        </span>
      )
    }
  }

  _goToRun = () => {
    this.props.goToRun(this.props.run.id)
  }
}
