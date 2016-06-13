import { action } from 'mobx'
import React, { Component } from 'react'
import AppGlobal from '../lib/app'
import projectsCollection from '../projects/projects-collection'

export default class ProjectsList extends Component {
  componentWillMount () {
    AppGlobal.ipc('get:project:paths').then(action('get:project:paths', (projectPaths) => {
      projectsCollection.setProjects(projectPaths)
    }))
  }

  render () {
    return (
      <div className="navbar-header dropdown">
        <a className="navbar-brand dropdown-toggle" href="#" data-toggle="dropdown">
          <i className="fa fa-folder-open"></i>{" "}
          jekyl-blog{" "}
          <span className="caret"></span>
        </a>
        <ul className="dropdown-menu">
          <li>
            <a href="#">
              <i className="fa fa-folder"></i>{" "}
              AdminApp
            </a>
          </li>
          <li role="separator" className="divider"></li>
          <li>
            <a href="#">
              <i className="fa fa-plus"></i>{" "}
              Add Project
            </a>
          </li>
        </ul>
      </div>
    )
  }
}
