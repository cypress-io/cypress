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
              { run.commit && run.commit.branch ?
                <span>
                  {run.commit.branch}
                  {this._displaySpec() ? ' / ' : null}
                </span> :
                null
              }
              {this._displaySpec()}
            </div>
            {
              run.commit ?
                <div className='msg'>
                  {
                    run.commit.authorEmail ?
                      <img
                        className='user-avatar'
                        height='13'
                        width='13'
                        src={`${gravatarUrl(run.commit.authorEmail)}`}
                      /> :
                      null
                  }
                  {
                    run.commit.message ?
                      <span className='commit-msg'>
                        {run.commit.message.split(NEWLINE)[0]}
                      </span> :
                      null
                  }
                </div> :
                <div className='msg italic'>
                  - No commit info found -
                </div>
            }

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
              run.totalDuration ?
                <span>
                  <i className='fa fa-hourglass-end'></i>{' '}
                  {durationFormatted(run.totalDuration)}
                </span> :
                run.createdAt ?
                  <TimerDisplay startTime={run.createdAt} /> :
                  null
            }
          </div>
        </div>
        <div className='row-column-wrapper env-data'>
          <div className='td-env-padding'>
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
                    <i className={`fa fa-fw fa-${osIcon(this.props.run.instances[0].platform.osName)}`}></i>{' '}
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
                  {run.totalPassed || '0'}
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
                  {run.totalFailed || '0'}
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
    if (!this.props.run.instances) return []

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${instance.platform.browserName} + ${instance.platform.browserVersion}`
    })
    .uniq()
    .value()
  }

  _browsersLength () {
    if (this._getUniqBrowsers()) {
      return this._getUniqBrowsers().length
    }
  }

  _browserIcon () {
    return browserIcon(this.props.run.instances[0].platform.browserName)
  }

  _osIcon () {
    if (!this._moreThanOneInstance() && this.props.run.instances.length) {
      return (osIcon(this.props.run.instances[0].platform.osName))
    } else {
      return 'desktop'
    }
  }

  _getUniqOs () {
    if (!this.props.run.instances) return

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${instance.platform.osName} + ${instance.platform.osVersionFormatted}`
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
          {this.props.run.instances[0].platform.osVersionFormatted}
        </span>
      )
    }
  }

  _browserDisplay = () => {
    if (this.props.run.instances && this.props.run.instances[0]) {
      return (
        <span>
          {browserVersionFormatted(this.props.run.instances[0].platform.browserVersion)}
        </span>
      )
    }
  }

  _goToRun = () => {
    this.props.goToRun(this.props.run.buildNumber)
  }
}
