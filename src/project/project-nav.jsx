import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Dropdown from '../dropdown/dropdown'

import projectsStore from '../projects/projects-store'

@observer
export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav className='navbar navbar-default'>
        <div className='container-fluid'>
          <div className='collapse navbar-collapse'>
            <ul className='nav navbar-nav'>
              <li>
                <a href='#'>
                  <i className='fa fa-code'></i>{' '}
                  Tests
                </a>
              </li>
              <li>
                <a href='#'>
                  <i className='fa fa-server'></i>{' '}
                  Builds
                </a>
              </li>
              <li>
                <a href='#'>
                  <i className='fa fa-cog'></i>{' '}
                  Config
                </a>
              </li>
            </ul>
            <ul className='nav navbar-nav navbar-right'>
              { this.browsers(project) }
              <li className='dropdown server-status'>
                <a href='#' className='dropdown-toggle' data-toggle='dropdown'>
                  <i className='fa fa-circle green'></i>{' '}
                  Running{' '}
                  <span className='dropdown-caret'></span>
                </a>
                <ul className='dropdown-menu'>
                  <li>
                    <a href='#'>
                      <i className='fa fa-circle red'></i>{' '}
                      Stop
                    </a>
                  </li>
                </ul>
              </li>
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
