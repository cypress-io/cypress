import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'

import { osIcon, browserIcon, gravatarUrl, getStatusIcon, durationFormatted } from '../lib/utils'

export default class BuildsListItem extends Component {
  render () {
    const build = this.props.build

    return (
      <li onClick={this._goToBuild}>
        <div className={`row-column-wrapper ${build.status}`}>
          <div>
            <i className={`fa fa-${getStatusIcon(this.props.status)}`}></i>
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
              <i className='fa fa-code-fork fa-rotate-90'></i>{' '}
              {build.commitBranch}{' '}
              <img
                className='user-avatar'
                height='13'
                width='13'
                src={`${gravatarUrl(build.commitAuthorEmail)}`}
              />
              {' '}
              {build.commitAuthorName}
            </div>
            <div className='msg'>
              {build.commitMessage}
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
          <div className={`td-border-left`}>
            {
              (this._moreThanOneInstance() && this._osLength() > 1) ?
                <span>
                  <i className={`fa fa-fw fa-desktop`}></i>{' '}
                  {this._osLength()}
                </span> :
                <span>
                  <i className={`fa fa-fw fa-${(this._osIcon())}`}></i>{' '}
                  {this._osDisplay()}
                </span>
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            {
              (this._moreThanOneInstance() && this._browsersLength() > 1) ?
                <span>
                  <i className={`fa fa-fw fa-globe`}></i>{' '}
                  {this._browsersLength()}
                </span> :
                <span>
                  <i className={`fa fa-fw fa-${this._browserIcon()}`}></i>{' '}
                  {this._browserDisplay()}
                </span>
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-border-left'>
            <i className="fa fa-circle-o-notch"></i>{' '}
            <span>
              {
                build.totalPending ?
                  build.totalPending :
                  '--'
              }
            </span>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className="fa fa-check green"></i>{' '}
            <span>
              {
                build.totalPasses ?
                  build.totalPasses :
                  "--"
              }
            </span>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className="fa fa-times red"></i>{' '}
            <span>
              {
                build.totalFailures ?
                  build.totalFailures :
                  "--"
              }
            </span>
          </div>
        </div>
      </li>
    )
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
        return `${instance.osName} + ${instance.osVersion}`
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
          {this.props.build.instances[0].osVersion}
        </span>
      )
    }
  }

  _browserDisplay = () => {
    if (this.props.build.instances && this.props.build.instances[0]) {
      return (
        <span>
          {this.props.build.instances[0].browserVersion}
        </span>
      )
    }
  }

  _goToBuild = () => {
    this.props.goToBuild(this.props.build.id)
  }
}
