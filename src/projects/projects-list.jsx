import _ from 'lodash'
import App from '../lib/app'
import React, { Component } from 'react'
import { Link } from 'react-router'
import { observer } from 'mobx-react'

import projectsStore from '../projects/projects-store'

@observer
export default class Projects extends Component {
  render () {
    if (!projectsStore.projects.length) return this._empty()

    return (
      <div className="content-wrapper">
        { this._error() }
        <ul className='projects-list list-as-table'>
          { _.map(projectsStore.projects, (project) => (
              this._project(project)
          ))}
        </ul>
      </div>
    )
  }

  _project = (project) => {
    if (project.empty) {
      return (
        <span>Projects</span>
      )
    } else {
      return (
        <li key={project.id}>
          <Link
            to={`/projects/${project.id}`}
            >
            <div>
              <div>
                <div className='project-name'>
                  <i className="fa fa-folder"></i>{" "}
                  { project.name }{' '}
                </div>

                <div className='project-path'>{ project.displayPath }</div>
              </div>
            </div>
            <div>
              <i className="fa fa-chevron-right"></i>
            </div>
          </Link>
        </li>
      )
    }
  }

  _empty = () => (
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

  _error = () => {
    if (!projectsStore.error) return null

    return (
      <div className='alert alert-danger error'>
        <p className='text-center'>
          <i className='fa fa-exclamation-triangle'></i>{' '}
          { projectsStore.error }
        </p>
      </div>
    )
  }

  _openHelp = () => (
    App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
  )

  _removeProject = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
}
