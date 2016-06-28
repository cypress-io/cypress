import React, { Component } from 'react'
import Dropdown from '../dropdown/dropdown'
import { Link } from 'react-router'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav className='navbar navbar-default navbar-fixed-top'>
        <div className='container-fluid'>
          <div className='collapse navbar-collapse'>
            <ul className='nav navbar-nav'>
              <li>
                <Link
                  to={`/projects/${project.id}/specs`}
                  activeClassName='active'
                  >
                  <i className='fa fa-code'></i>{' '}
                  Tests
                </Link>
              </li>
              <li>
                <Link
                  to={`/projects/${project.id}/config`}
                  activeClassName='active'
                  >
                  <i className='fa fa-cog'></i>{' '}
                  Config
                </Link>
              </li>
            </ul>
            <ul className='nav navbar-nav navbar-right'>
              { this.browsers(project) }
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  browsers = (project) => {
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
    browser
    return (
      <span>
        <i className={`fa fa-${browser.icon}`}></i>{' '}
        { browser.displayName }
      </span>
    )
  }
}
