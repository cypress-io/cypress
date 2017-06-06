import { observer } from 'mobx-react'
import React, { Component } from 'react'

import appApi from '../lib/app-api'
import appStore from '../lib/app-store'
import authStore from '../lib/auth-store'
import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'
import { gravatarUrl } from '../lib/utils'
import projectsApi from '../projects/projects-api'

@observer
export default class Nav extends Component {
  render () {
    return (
      <nav className='navbar navbar-inverse navbar-fixed-top'>
        <div className='container-fluid'>
          <ul className='nav navbar-nav'>
            <li className='left-nav'>
              { this._leftNav() }
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
            { this._userStateButton() }
          </ul>
        </div>
      </nav>
    )
  }

  _leftNav = () => {
    if (appStore.isGlobal) {
      const project = viewStore.currentView.project
      return <div>{project && project.displayName}</div>
    }

    return <div>TBD</div>
    // if (this.props.params.clientId) {
    //   return (
    //     <Link
    //       to="/projects"
    //       onClick={this._closeProject.bind(this)}
    //       >
    //       <i className="fa fa-chevron-left"></i>{' '}
    //       Back to Projects
    //     </Link>
    //   )
    // } else {
    //   return (
    //     <a onClick={this._addProject} href='#'>
    //       <i className='fa fa-plus'></i>{' '}
    //       Add Project
    //     </a>
    //   )
    // }
  }

  _userStateButton = () => {
    if (!authStore.isAuthenticated) return null

    return (
      <li className='dropdown'>
        <a href='#' className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
          <img
            className='user-avatar'
            height='13'
            width='13'
            src={`${gravatarUrl(authStore.user.email)}`}
          />
        {' '}{ authStore.user.displayName }{' '}
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
    )
  }

  // _closeProject = () => {
  //   projectsApi.closeProject(this.props.params.clientId)
  // }

  _openDocs (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io')
  }

  _openChat (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/chat')
  }

  _logout = (e) => {
    e.preventDefault()

    appApi.logOut()
  }

  _addProject (e) {
    e.preventDefault()
    projectsApi.addProject()
  }
}
