import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'
import Dropdown from '../dropdown/dropdown'

import { closeBrowser } from '../projects/projects-api'

@observer
export default class Browsers extends Component {
  render () {
    const project = this.props.project

    if (!project.browsers.length) return null

    return (
      <ul className='browsers nav navbar-nav navbar-right'>
        {this._closeBrowserBtn()}
        {this._info()}
        <Dropdown
          className='browsers-list'
          disabled={project.browserState === 'opened' || project.browserState === 'opening'}
          chosen={project.chosenBrowser}
          others={project.otherBrowsers}
          onSelect={this._onSelect}
          renderItem={this._browser}
          keyProperty='name'
          browserState={project.browserState}
        />
    </ul>
    )
  }

  _closeBrowserBtn () {
    if (this.props.project.browserState === 'opened') {
      return (
        <li className='close-browser'>
          <button className="btn btn-xs btn-danger" onClick={this._closeBrowser.bind(this)}>
            <i className='fa fa-fw fa-times'></i>
            Stop
          </button>
        </li>
      )
    }
  }

  _info () {
    const { chosenBrowser } = this.props.project
    if (!chosenBrowser || !chosenBrowser.info) return null

    return (
      <li className='browser-info'>
        <Tooltip
          title={chosenBrowser.info}
          placement='bottom'
          className='browser-info-tooltip cy-tooltip'
        >
          <i className='fa fa-info-circle' />
        </Tooltip>
      </li>
    )
  }

  _closeBrowser = (e) => {
    e.preventDefault()
    closeBrowser(this.props.project.clientId)
  }

  _onSelect = (browser) => {
    this.props.project.setChosenBrowser(browser)
  }

  _browser = (browser) => {
    let prefixText

    switch (this.props.project.browserState) {
      case 'opening':
        prefixText = 'Opening'
        break
      case 'opened':
        prefixText = 'Running'
        break
      default:
        prefixText = ''
        // clearActiveSpec()
    }

    return (
      <span>
        <i className={`fa fa-${browser.icon}`}></i>{' '}
        { prefixText }{' '}
        { browser.displayName }{' '}
        { browser.majorVersion }
      </span>
    )
  }
}
