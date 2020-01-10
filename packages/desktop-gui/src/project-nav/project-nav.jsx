import React, { Component } from 'react'

import Browsers from './browsers'
import { Link, routes } from '../lib/routing'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav className='project-nav navbar navbar-default'>
        <ul className='nav left-nav'>
          <li>
            <Link to={routes.specs(project)}>
              <i className='fas fa-code'></i>{' '}
              Tests
            </Link>
          </li>
          <li>
            <Link to={routes.runs(project)}>
              <i className='fas fa-database'></i>{' '}
              Runs
            </Link>
          </li>
          <li>
            <Link to={routes.settings(project)}>
              <i className='fas fa-cog'></i>{' '}
              Settings
            </Link>
          </li>
        </ul>
        <div className='spacer' />
        <Browsers project={project} />
      </nav>
    )
  }
}
