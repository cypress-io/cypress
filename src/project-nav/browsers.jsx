import React, { Component } from 'react'
import Dropdown from '../dropdown/dropdown'
import { observer } from 'mobx-react'

@observer
export default class Browsers extends Component {
  render () {
    const project = this.props.project

    if (!project.browsers.length) return null

    return (
      <Dropdown
        className='browsers-list'
        chosen={project.chosenBrowser}
        others={project.otherBrowsers}
        onSelect={this._onSelect}
        renderItem={this._browser}
        keyProperty='name'
      />
    )
  }

  _onSelect = (browser) => {
    this.props.project.setChosenBrowser(browser)
  }

  _browser = (browser) => {
    return (
      <span>
        <i className={`fa fa-${browser.icon}`}></i>{' '}
        { browser.displayName }{' '}
        { browser.majorVersion }
      </span>
    )
  }
}
