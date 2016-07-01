import _ from 'lodash'
import App from '../lib/app'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { ContextMenu, MenuItem } from "react-contextmenu"

import Project from './projects-list-item/'

import projectsStore from './projects-store'

class MyContextMenu extends Component {
  render () {
    return (
      <ContextMenu identifier="context-menu">
        <MenuItem onClick={this.handleClick}>
          <i className='fa fa-minus-circle red'></i>{' '}
          Remove project
        </MenuItem>
      </ContextMenu>
    )
  }

  handleClick (e, project) {
    projectsStore.removeProject(project.id)

    App.ipc("remove:project", project.path)
  }
}

@observer
export default class Projects extends Component {
  render () {
    if (!projectsStore.projects.length) return this._empty()

    return (
      <div className="content-wrapper">
        { this._error() }
        <ul className='projects-list list-as-table'>
          { _.map(projectsStore.projects, (project) => (
            <li key={project.id} className='li'>
              <Project project={project} />
            </li>
          ))}
        </ul>
        <MyContextMenu />
      </div>
    )
  }

  _empty () {
    return (
      <div className='empty'>
        <h4>Add your first project</h4>
        <p>To begin testing, click <i className='fa fa-plus'></i> above to choose a folder that has the resources of your project.</p>
        <p>Often this is the root folder of a source controlled project.</p>
        { this._error() }
        <p className='helper-docs-append'>
          <a onClick={this._openHelp} className='helper-docs-link'>
            <i className='fa fa-question-circle'></i>{' '}
            Need help?
          </a>
        </p>
      </div>
    )
  }

  _error () {
    if (!projectsStore.error) return null

    return (
      <div className='alert alert-danger error alert-in-projects'>
        <p className='text-center'>
          <i className='fa fa-exclamation-triangle'></i>{' '}
          { projectsStore.error }
        </p>
      </div>
    )
  }

  _openHelp () {
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
  }

}
