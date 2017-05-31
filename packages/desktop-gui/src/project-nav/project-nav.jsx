import React, { Component } from 'react'
import Browsers from './browsers'
import { NavLink } from 'react-router-dom'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav className='navbar navbar-default navbar-fixed-top'>
        <div className='container-fluid'>
          <ul className='nav navbar-nav'>
            <li>
              <NavLink
                to={`/projects/${project.clientId}/specs`}
                activeClassName='active'
                >
                <i className='fa fa-code'></i>{' '}
                Tests
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`/projects/${project.clientId}/runs`}
                activeClassName='active'
                >
                <i className='fa fa-database'></i>{' '}
                Runs
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`/projects/${project.clientId}/config`}
                activeClassName='active'
                >
                <i className='fa fa-cog'></i>{' '}
                Settings
              </NavLink>
            </li>
          </ul>
          <Browsers project={project} />
        </div>
      </nav>
    )
  }
}
