import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import state from '../lib/state'
import App from '../lib/app'
import Tooltip from 'rc-tooltip'
import { Link } from 'react-router'

import projectsStore from '../projects/projects-store'
import { closeProject, addProject } from '../projects/projects-api'

@observer
export default class Nav extends Component {
  render () {
    return (
      <nav className='navbar navbar-inverse navbar-fixed-top'>
        <div className='container-fluid'>
          <ul className='nav navbar-nav'>
            <li>
              { this.leftNavButton() }
            </li>
          </ul>
          <ul className='nav navbar-nav navbar-right'>
            <li>
              <a onClick={this._openDocs} href='#'>
                <i className='fa fa-graduation-cap'></i>{' '}
                Docs
              </a>
            </li>
            <li>
              <a onClick={this._openChat} href='#'>
                <i className='fa fa-comments'></i>{' '}
                Chat
              </a>
            </li>
            <li className='dropdown'>
              <a href='#' className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                <i className='fa fa-user'></i>{' '}
                { state.user.displayName }{' '}
                <span className='caret'></span>
              </a>
              <ul className='dropdown-menu'>
                <li>
                  <a href='#' onClick={this._logout}>
                    <i className="fa fa-sign-out"></i>{' '}
                    Log Out
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    )
  }

  leftNavButton = () => {
    if (this.props.params.id) {
      return (
        <Link
          to="/projects"
          onClick={closeProject}
          >
          <i className="fa fa-chevron-left"></i>{' '}
          Back to Projects
        </Link>
      )
    } else {
      const hasProjects = !!projectsStore.projects.length
      const tooltip = hasProjects ? 'Add Project' : 'Click here'

      return (
        <Tooltip
          placement='bottom'
          visible={!hasProjects}
          overlay={tooltip}
          align={{
            points: ['bc', 'tc'], // align bottom center point of sourceNode with top center point of targetNode
          }}
          >
          <a onClick={this._addProject} href='#'>
            <i className='fa fa-plus'></i>{' '}
            Add Project
          </a>
        </Tooltip>
      )
    }
  }

  _openDocs = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io')
  }

  _openChat = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://gitter.im/cypress-io/cypress')
  }

  _logout = (e) => {
    e.preventDefault()

    App.ipc('log:out')
    .then(action('logged:out', () => {
      state.setUser(null)
      return App.ipc('clear:github:cookies')
    }))
  }

  _addProject (e) {
    e.preventDefault()
    addProject()
  }
}
