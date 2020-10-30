import _ from 'lodash'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'
import { BrowserIcon } from '@packages/ui-components'
import TimerDisplay from '../duration-timer/TimerDisplay'

import {
  browserNameFormatted,
  browserVersionFormatted,
  durationFormatted,
  getFormattedTimeFromNow,
  getStatusIcon,
  gravatarUrl,
  osIcon,
  stripLeadingCyDirs,
  stripSharedDirsFromDir2,
} from '../lib/utils'

const RunDuration = ({ run }) => {
  // Run was blocked due to exceeding limit
  if (run.status === 'overLimit') {
    return null
  }

  // Run has completed
  if (run.totalDuration) {
    if (run.parallelizationDisabled) {
      return (
        <Tooltip title="Parallelization was disabled for this run." placement="top" className="cy-tooltip">
          <span className='env-duration'>
            <i className='fas fa-exclamation-triangle orange'></i>
            {' '}{durationFormatted(run.totalDuration)}
          </span>
        </Tooltip>
      )
    }

    return (
      <span className='env-duration'>
        <i className='fas fa-hourglass-end'></i>
        {' '}{durationFormatted(run.totalDuration)}
      </span>
    )
  }

  // Run is still going
  if (run.createdAt) {
    return (
      <TimerDisplay startTime={run.createdAt}/>
    )
  }

  return null
}

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
              <i className={`fas ${run.status} fa-${getStatusIcon(run.status)}`}></i>
            </Tooltip>
            {' '}#{run.buildNumber}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-top-padding'>
            <div>
              {run.commit && run.commit.branch ?
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
                      <div className='msg italic'>
                        - No commit info found -
                      </div>
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
            <i className='far fa-clock'></i>{' '}
            {getFormattedTimeFromNow(run.createdAt)}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-padding'>
            <RunDuration run={run}/>
          </div>
        </div>
        <div className='row-column-wrapper env-data'>
          <div className='td-env-padding'>
            {/* // do we have multiple OS's ? */}
            {
              this._instancesExist() ?
                this._moreThanOneInstance() && this._osLength() > 1 ?
                  <div>
                    <i className='fas fa-fw fa-desktop'></i>{' '}
                    {this._osLength()} OSs
                  </div> :
                  // or did we only actual run it on one OS
                  <div>
                    <i className={`fa-fw ${this._osIcon()}`}></i>{' '}
                    {this._osDisplay()}
                  </div> :
                null
            }
            {/* // do we have multiple browsers ? */}
            {
              this._instancesExist() ?
                this._moreThanOneInstance() && this._browsersLength() > 1 ?
                  <div className='env-msg'>
                    <i className='fas fa-fw fa-globe'></i>{' '}
                    {this._browsersLength()} browsers
                  </div> :
                  // or did we only actual run it on one browser
                  <div className='env-msg'>
                    {this._browserIcon()}{' '}
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
                <i className='fas fa-check'></i>{' '}
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
                <i className='fas fa-times'></i>{' '}
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
    if (this.props.run.instances.length === 1) {
      return (
        this.props.run.instances[0].spec ?
          <span>
            {
              this.props.run.instances[0].integrationFolder ?
                stripSharedDirsFromDir2(this.props.run.instances[0].integrationFolder, this.props.run.instances[0].spec, this.props.run.instances[0].platform.osName) ?
                  stripSharedDirsFromDir2(this.props.run.instances[0].integrationFolder, this.props.run.instances[0].spec, this.props.run.instances[0].platform.osName) :
                  this.props.run.instances[0].spec :
                stripLeadingCyDirs(this.props.run.instances[0].spec)
            }
          </span> :
          null
      )
    }
  }

  _getUniqBrowsers () {
    if (!this.props.run.instances) return []

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${_.get(instance, 'platform.browserName', '')} + ${_.get(instance, 'platform.browserVersion', '')}`
    })
    .uniq()
    .value()
  }

  _browsersLength () {
    return this._getUniqBrowsers().length
  }

  _osIcon () {
    const icon = osIcon(this.props.run.instances[0].platform.osName)

    return icon === 'desktop' ? `fas fa-${icon}` : `fab fa-${icon}`
  }

  _getUniqOs () {
    if (!this.props.run.instances) return

    return _
    .chain(this.props.run.instances)
    .map((instance) => {
      return `${_.get(instance, 'platform.osName', '')} + ${_.get(instance, 'platform.osVersion', '')}`
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
        `${_.get(this.props.run, 'instances[0].platform.osVersionFormatted', this.props.run.instances[0].osFormatted)}`
      )
    }
  }

  _browserIcon = () => {
    const browserName = _.get(this.props.run, 'instances[0].platform.browserName', '')

    return browserName ? <BrowserIcon browserName={browserName}/> : null
  }

  _browserDisplay = () => {
    if (this.props.run.instances && this.props.run.instances[0]) {
      return (
        `${browserNameFormatted(_.get(this.props.run, 'instances[0].platform.browserName', ''))} ${browserVersionFormatted(_.get(this.props.run, 'instances[0].platform.browserVersion', ''))}`
      )
    }
  }

  _goToRun = () => {
    this.props.goToRun(this.props.run.buildNumber)
  }
}
