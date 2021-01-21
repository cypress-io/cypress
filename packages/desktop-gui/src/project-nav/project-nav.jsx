import React, { Component } from 'react'

import Browsers from './browsers'
import { Link, routes } from '../lib/routing'

export default class ProjectNav extends Component {
  render () {
    const project = this.props.project

    const links = [
      {
        icon: 'fas fa-code',
        to: routes.specs(project),
        label: 'Tests',
      },
      {
        icon: 'fas fa-database',
        to: routes.runs(project),
        label: 'Runs',
      },
      {
        icon: 'fas fa-cog',
        to: routes.settings(project),
        label: 'Settings',
      },
    ]

    return (
      <nav id="project-nav" className='project-nav navbar navbar-expand navbar-default'>
        <div className="container-fluid p-0">
          <ul className='navbar-nav'>
            {links.map((link) => (<li className="nav-item">
              <Link className="nav-link px-3" to={link.to}>
                <i className={`${link.icon} me-2`}></i>
                {link.label}
              </Link>
            </li>))}
          </ul>
          <Browsers project={project} />
        </div>
      </nav>
    )
  }
}
