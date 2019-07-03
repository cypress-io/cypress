import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'
import Dropdown from '../dropdown/dropdown'

import projectsApi from '../projects/projects-api'

@observer
export default class Browsers extends Component {
  render () {
    const project = this.props.project

    if (!project.browsers.length) return null

    return (
      <ul className='browsers nav navbar-nav navbar-right'>
        {this._closeBrowserBtn()}
        <Dropdown
          className='browsers-list'
          disabled={project.browserState === 'opened' || project.browserState === 'opening'}
          chosen={project.chosenBrowser}
          others={project.otherBrowsers}
          onSelect={this._onSelect}
          renderItem={this._browser}
          keyProperty='path'
          browserState={project.browserState}
        />
      </ul>
    )
  }

  _closeBrowserBtn () {
    if (this.props.project.browserState === 'opened') {
      return (
        <li className='close-browser'>
          <button className='btn btn-xs btn-danger' onClick={this._closeBrowser.bind(this)}>
            <i className='fa fa-fw fa-times'></i>
            Stop
          </button>
        </li>
      )
    }
  }

  _closeBrowser = (e) => {
    e.preventDefault()
    projectsApi.closeBrowser(this.props.project)
  }

  _onSelect = (browser) => {
    this.props.project.setChosenBrowser(browser)
  }

  _browser = (browser) => {
    const project = this.props.project
    let icon
    let prefixText

    if (project.browserState === 'opening') {
      icon = 'refresh fa-spin'
      prefixText = 'Opening'
    } else if (project.browserState === 'opened') {
      icon = 'check-circle-o green'
      prefixText = 'Running'
    } else {
      icon = browser.icon
      prefixText = ''
    }

    return (
      <span className={browser.name}>
        <i className={`fa fa-${icon}`}></i>{' '}
        {prefixText}{' '}
        {browser.displayName}{' '}
        {browser.majorVersion}
        {this._info(browser)}
      </span>
    )
  }

  _info (browser) {
    if (!browser.info) return null

    return (
      <span className='browser-info'>
        <Tooltip
          title={browser.info}
          placement='bottom'
          className='browser-info-tooltip cy-tooltip'
        >
          <i className='fa fa-info-circle' />
        </Tooltip>
      </span>
    )
  }
}
