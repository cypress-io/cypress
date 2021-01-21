import React, { Component } from 'react'

import Browsers from './browsers'
import { Link, routes } from '../lib/routing'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav id="project-nav" className='project-nav navbar navbar-expand navbar-default'>
        <div className="container-fluid p-0">
          <ul className='navbar-nav'>
            <li className="nav-item">
              <Link className="nav-link" to={routes.specs(project)}>
                <i className='fas fa-code'></i>{' '}
              Tests
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.runs(project)}>
                <i className='fas fa-database'></i>{' '}
              Runs
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.settings(project)}>
                <i className='fas fa-cog'></i>{' '}
              Settings
              </Link>
            </li>
          </ul>
          <Browsers project={project} />
        </div>
      </nav>
    )
  }
}
