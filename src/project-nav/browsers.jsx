/*global $*/

import React, { Component } from 'react'
import Dropdown from '../dropdown/dropdown'
import { observer } from 'mobx-react'
import Tooltip from 'rc-tooltip'

import { closeBrowser } from '../projects/projects-api'

@observer
export default class Browsers extends Component {
  render () {
    const project = this.props.project

    if (!project.browsers.length) return null

    return (
      <ul className='nav navbar-nav navbar-right'>
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
        {this._closeBrowserBtn()}
      </ul>
    )
  }

  _closeBrowserBtn = () => {
    if (this.props.project.browserState === 'opened') {
      return (
        <li className='close-browser'>
          <a href='#' className='btn-link' onClick={this._closeBrowser.bind(this)}>
            <i className='fa fa-times red'></i>
          </a>
        </li>
      )
    }
  }

  _closeBrowser = (e) => {
    e.preventDefault()
    closeBrowser(this.props.project.id)
  }

  _onSelect = (browser) => {
    this.props.project.setChosenBrowser(browser)
  }

  _browser = (browser) => {
    let prefixText

    if (this.props.project.browserState === 'opening') {
      prefixText = 'Opening'
    } else if (this.props.project.browserState === 'opened') {
      prefixText = 'Running'
    } else {
      prefixText = ''
      $('.file>a.active').removeClass('active')
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
