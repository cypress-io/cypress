import _ from 'lodash'
import App from '../lib/app'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { ContextMenu, MenuItem } from "react-contextmenu"

import Project from './projects-list-item/'
import { closeProject, pollProjects, stopPollingProjects } from './projects-api'
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
    projectsStore.removeProject(project.clientId)

    App.ipc("remove:project", project.path)
  }
}

@observer
export default class Projects extends Component {
  constructor (props) {
    super(props)
    closeProject()
  }

  componentDidMount () {
    this.pollId = pollProjects()
  }

  componentWillUnmount () {
    stopPollingProjects(this.pollId)
  }

  render () {
    if (!projectsStore.projects.length) return this._empty()

    return (
      <div className="content-wrapper">
        { this._error() }
        <ul className='projects-list list-as-table'>
          { _.map(projectsStore.projects, (project) => (
            <li key={project.clientId} className='li'>
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
        <p>To begin testing, click <strong><i className='fa fa-plus'></i> Add Project</strong> above.</p>
        <p>Choose the folder with the resources of your project.</p>
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
      <div className='alert alert-danger error alert-in-projects alert-dismissable'>
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <p className='text-center'>
          <i className='fa fa-exclamation-triangle'></i>{' '}
          { this._errorMessage(projectsStore.error) }
        </p>
      </div>
    )
  }

  _errorMessage (message) {
    function createMarkup () {
      return {
        __html: message.replace('\n', '<br /><br />'),
      }
    }

    return (
      <span dangerouslySetInnerHTML={createMarkup()} />
    )
  }

  _openHelp () {
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
  }

}
