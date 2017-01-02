import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'

import { osIcon, browserIcon, gravatarUrl, getStatusIcon, durationFormatted, browserVersionFormatted } from '../lib/utils'

export default class BuildsListItem extends Component {
  render () {
    const build = this.props.build

    return (
      <li onClick={this._goToBuild}>
        <div className={`row-column-wrapper ${build.status}`}>
          <div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className={`fa ${build.status} fa-${getStatusIcon(build.status)}`}></i>{' '}
            #{build.buildNumber}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-top-padding'>
            <div>
              <i className='fa fa-fw fa-code-fork fa-rotate-90'></i>{' '}
              {build.commitBranch}{' '}
            </div>
            <div className='msg'>
              <img
                className='user-avatar'
                height='13'
                width='13'
                src={`${gravatarUrl(build.commitAuthorEmail)}`}
              />
              {
                build.commitMessage ?
                  <span className='commit-msg'>
                    {build.commitMessage.split('\n')[0]}
                  </span> :
                  null
              }
            </div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className='fa fa-clock-o'></i>{' '}
            { moment(build.createdAt).fromNow() }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            {
              build.totalDuration ?
                <span>
                  <i className='fa fa-hourglass-end'></i>{' '}
                  {durationFormatted(build.totalDuration)}
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
                  <i className={`fa fa-fw fa-desktop`}></i>{' '}
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
                    <i className={`fa fa-fw fa-globe`}></i>{' '}
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
          <div className='result'>
            <i className="fa fa-circle-o-notch"></i>{' '}
            <span>
              {
                build.totalPending ?
                  build.totalPending :
                  '-'
              }
            </span>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='result'>
            <i className="fa fa-check green"></i>{' '}
            <span>
              {
                build.totalPasses ?
                  build.totalPasses :
                  "-"
              }
            </span>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='result'>
            <i className="fa fa-times red"></i>{' '}
            <span>
              {
                build.totalFailures ?
                  build.totalFailures :
                  "-"
              }
            </span>
          </div>
        </div>
      </li>
    )
  }

  _allInstancesArePresent () {
    return this.props.build.expectedInstances === this.props.build.instances.length
  }

  _moreThanOneInstance () {
    return (this.props.build.instances.length > 1)
  }

  _getUniqBrowsers () {
    if (!this.props.build.instances) return 0

    return _
      .chain(this.props.build.instances)
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
    if (!this._moreThanOneInstance() && this.props.build.instances.length) {
      return (browserIcon(this.props.build.instances[0].browserName))
    } else {
      return 'globe'
    }
  }

  _osIcon () {
    if (!this._moreThanOneInstance() && this.props.build.instances.length) {
      return (osIcon(this.props.build.instances[0].osName))
    } else {
      return 'desktop'
    }
  }

  _getUniqOs () {
    if (!this.props.build.instances) return

    return _
      .chain(this.props.build.instances)
      .map((instance) => {
        return `${instance.osName} + ${instance.osFormatted}`
      })
      .uniq()
      .value()
  }

  _osLength () {
    return this._getUniqOs().length
  }

  _osDisplay = () => {
    if (this.props.build.instances && this.props.build.instances[0]) {
      return (
        <span>
          {this.props.build.instances[0].osFormatted}
        </span>
      )
    }
  }

  _browserDisplay = () => {
    if (this.props.build.instances && this.props.build.instances[0]) {
      return (
        <span>
          {browserVersionFormatted(this.props.build.instances[0].browserVersion)}
        </span>
      )
    }
  }

  _goToBuild = () => {
    this.props.goToBuild(this.props.build.id)
  }
}
