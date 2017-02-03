import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Link } from 'react-router'

import state from '../lib/state'
import App from '../lib/app'
import { gravatarUrl } from '../lib/utils'
import { closeProject, addProject } from '../projects/projects-api'

@observer
export default class Nav extends Component {
  render () {
    return (
      <nav className='navbar navbar-inverse navbar-fixed-top'>
        <div className='container-fluid'>
          <ul className='nav navbar-nav'>
            <li>
              { this._leftNavButton() }
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

  _leftNavButton = () => {
    if (this.props.params.clientId) {
      return (
        <Link
          to="/projects"
          onClick={this._closeProject.bind(this)}
          >
          <i className="fa fa-chevron-left"></i>{' '}
          Back to Projects
        </Link>
      )
    } else {
      return (
        <a onClick={this._addProject} href='#'>
          <i className='fa fa-plus'></i>{' '}
          Add Project
        </a>
      )
    }
  }

  _userStateButton = () => {
    if (state.hasUser) {
      return (
        <li className='dropdown'>
          <a href='#' className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
            <img
              className='user-avatar'
              height='13'
              width='13'
              src={`${gravatarUrl(state.email)}`}
            />
            {' '}{ state.user.displayName }{' '}
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
    //  else {
    //   return (
    //     <li>
    //       <Link to='/login'>
    //         <i className='fa fa-sign-in'></i>{' '}
    //         Log In
    //       </Link>
    //     </li>
    //   )
    // }
  }

  _closeProject = () => {
    closeProject(this.props.params.clientId)
  }

  _openDocs (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io')
  }

  _openChat (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/chat')
  }

  _logout = (e) => {
    e.preventDefault()

    state.logOut()
  }

  _addProject (e) {
    e.preventDefault()
    addProject()
  }
}
