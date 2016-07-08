import React, { Component } from 'react'
import Browsers from './browsers'
import { Link } from 'react-router'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    return (
      <nav className='navbar navbar-default navbar-fixed-top'>
        <div className='container-fluid'>
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
            <Browsers project={project} />
          </ul>
        </div>
      </nav>
    )
  }
}
