import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

import { osIcon, browserIcon, gravatarUrl, getStatusIcon, durationFormatted, browserVersionFormatted } from '../lib/utils'

export default class RunsListItem extends Component {
  render () {
    const run = this.props.run

    return (
      <li onClick={this._goToRun}>
        <div className={`row-column-wrapper ${run.status}`}>
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
              {
                run.commitBranch ?
                  run.commitBranch :
                  null
              }
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
                    {' '}
                    {run.commitMessage.split('\n')[0]}
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
              run.totalDuration ?
                <span>
                  <i className='fa fa-hourglass-end'></i>{' '}
                  {durationFormatted(run.totalDuration)}
                </span> :
                null
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            {
              // only display something if we have all of the instances back
              this._allInstancesArePresent() ?
              // do we have multiple OS's ?
      this._moreThanOneInstance() && this._osLength() > 1 ?
        <span>
          <i className='fa fa-fw fa-desktop'></i>{' '}
          {this._osLength()}
        </span> :
        // or did we only actual run it on one OS
        <span>
          <i className={`fa fa-fw fa-${(this._osIcon())}`}></i>{' '}
          {this._osDisplay()}
        </span> :
                null
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            {
              // only display something if we have all of the instances back
              this._allInstancesArePresent() ?
                // do we have multiple browsers ?
      this._moreThanOneInstance() && this._browsersLength() > 1 ?
        <span>
          <i className='fa fa-fw fa-globe'></i>{' '}
          {this._browsersLength()}
        </span> :
        // or did we only actual run it on one browser
        <span>
          <i className={`fa fa-fw fa-${this._browserIcon()}`}></i>{' '}
          {this._browserDisplay()}
        </span> :
                null
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          {
            run.status !== 'running' ?
              <div className='result'>
                <i className='fa fa-circle-o-notch'></i>{' '}
                <span>
                  {run.totalPending ? run.totalPending : '-'}
                </span>
              </div> :
              null
          }
        </div>
        <div className='row-column-wrapper'>
          {
            run.status !== 'running' ?
              <div className='result'>
                <i className='fa fa-check green'></i>{' '}
                <span>
                  {run.totalPasses ? run.totalPasses : '-'}
                </span>
              </div> :
              null
          }
        </div>
        <div className='row-column-wrapper'>
          {
            run.status !== 'running' ?
              <div className='result'>
                <i className='fa fa-times red'></i>{' '}
                <span>
                  {run.totalFailures ? run.totalFailures : '-'}
                </span>
              </div> :
              null
          }
        </div>
      </li>
    )
  }

  _allInstancesArePresent () {
    if (this.props.run.instances) {
      return this.props.run.expectedInstances === this.props.run.instances.length
    }
  }

  _moreThanOneInstance () {
    return (this.props.run.instances.length > 1)
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
    if (!this._moreThanOneInstance() && this.props.run.instances.length) {
      return (browserIcon(this.props.run.instances[0].browserName))
    } else {
      return 'globe'
    }
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
