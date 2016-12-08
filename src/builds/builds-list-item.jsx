import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'

import App from '../lib/app'

import { osIcon, browserIcon, commitEmailHash, getStatusIcon } from './utils'

export default class BuildsListItem extends Component {
  render () {
    return (
      <li onClick={this._goToBuild}>
        <div className={`row-column-wrapper ${this.props.status}`}>
          <div>
            <i className={`fa fa-${getStatusIcon(this.props.status)}`}></i>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            #{this.props.buildNumber}
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <div>
              <i className='fa fa-code-fork fa-rotate-90'></i>{' '}
              {this.props.commitBranch}{' '}
              <img height='13' width='13' src={`https://www.gravatar.com/avatar/${commitEmailHash(this.props.commitAuthorEmail)}`} />
              {' '}
              {this.props.commitAuthorName}
            </div>
            <div className='msg'>
              {this.props.commitMessage}
            </div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className='fa fa-clock-o'></i> started{' '}
            { moment(this.props.createdAt).fromNow() }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className='fa fa-hourglass-end'></i> ran for{' '}
            {
              this.props.totalDuration ?
                moment.duration(this.props.totalDuration).humanize() :
                null
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className={`td-border-left`}>
            <i className={`fa fa-fw fa-${this._osIcon()}`}></i>{' '}
            {
              (this._moreThanOneInstance() && this._osLength() > 1) ?
                <span>{this._osLength()}</span> :
                <span>{this._osDisplay()}</span>
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            <i className={`fa fa-fw fa-${this._browserIcon()}`}></i>{' '}
            {
              (this._moreThanOneInstance() && this._browsersLength() > 1) ?
                <span>{this._browsersLength()}</span> :
                <span>{this._browserDisplay()}</span>
            }
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='td-border-left'>
            Pass{' '}
            <span className='label label-success'>{this.props.totalPasses}</span>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div>
            Fail{' '}
            <span className='label label-danger'>{this.props.totalFailures}</span>
          </div>
        </div>
      </li>
    )
  }

  _moreThanOneInstance () {
    return (this.props.instances.length > 1)
  }

  _getUniqBrowsers () {
    if (!this.props.instances) return 0

    return _
      .chain(this.props.instances)
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
    if (!this._moreThanOneInstance() && this.props.instances.length) {
      return (browserIcon(this.props.instances[0].browserName))
    } else {
      return 'globe'
    }
  }

  _osIcon () {
    if (!this._moreThanOneInstance() && this.props.instances.length) {
      return (osIcon(this.props.instances[0].osName))
    } else {
      return 'desktop'
    }
  }

  _getUniqOs () {
    if (!this.props.instances) return

    return _
      .chain(this.props.instances)
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
    if (this.props.instances && this.props.instances[0]) {
      return (
        <span>
          <i className={`fa fa-${osIcon(this.props.instances[0].osName)}`}></i>
          {' '}
          {this.props.instances[0].osVersion}
        </span>
      )
    }
  }

  _browserDisplay = () => {
    if (this.props.instances && this.props.instances[0]) {
      return (
        <span>
          {this.props.instances[0].browserName}{' '}
          {this.props.instances[0].browserVersion}
        </span>
      )
    }
  }

  _goToBuild = () => {
    App.ipc('external:open', `https://on.cypress.io/admin/builds/${this.props.id}`)
  }
}
