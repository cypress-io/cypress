import React, { Component } from 'react'
import Browsers from './browsers'
import { Link } from 'react-router'
import App from '../lib/app'

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
              {
                this._launchBrowserBtn()
              }
              <Browsers project={project} />
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  _launchBrowserBtn () {
    // we want this to only run in development
    if (window.env === 'development') {
      return (
        <li onClick={this._launchBrowser}>
          <a href="#">Launch Browser</a>
        </li>
      )
    }
  }

  _launchBrowser (e) {
    e.preventDefault()
    App.ipc('launch:browser', {
      browser: 'chrome',
      url: 'http://localhost:2020',
    }, function (err, data) {
      err, data
    })
  }
}
