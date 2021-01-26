import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Dropdown } from '@packages/ui-components'

import appStore from '../lib/app-store'
import authApi from '../auth/auth-api'
import authStore from '../auth/auth-store'
import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'
import { gravatarUrl } from '../lib/utils'
import { Link, routes } from '../lib/routing'

@observer
export default class Nav extends Component {
  render () {
    return (
      <nav id="main-nav" className='navbar navbar-dark bg-dark navbar-expand'>
        <div className="container-fluid">
          {this._leftNav()}
          <ul className='navbar-nav'>
            <li className="nav-item">
              <a className="nav-link" onClick={this._openSupport} href='#'>
                <i className='fas fa-question-circle'></i> Support
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" onClick={this._openDocs} href='#'>
                <i className='fas fa-graduation-cap'></i> Docs
              </a>
            </li>
            {this._userStateButton()}
          </ul>
        </div>
      </nav>
    )
  }

  _leftNav = () => {
    const project = viewStore.currentView.project

    // project mode
    if (!appStore.isGlobalMode) {
      return <div className='navbar-brand'>{project && project.displayName}</div>
    }

    // global mode, on project page
    if (appStore.isGlobalMode && project) {
      return (
        <Link className="navbar-brand" to={routes.intro()}>
          <i className='fas fa-chevron-left'></i> Back
        </Link>
      )
    }

    // global mode, on intro page
    return (
      <a className='navbar-brand'>
        <img src={require('@cypress/icons/dist/logo/cypress-inverse.png')} style={{ height: 30 }} />
      </a>
    )
  }

  _userStateButton = () => {
    if (authStore.isLoading) {
      return (
        <li className="nav-item">
          <a className="nav-link">
            <i className='fas fa-user' /> <i className='fas fa-spinner fa-spin' />
          </a>
        </li>
      )
    }

    if (!authStore.isAuthenticated) {
      return (
        <li className="nav-item">
          <a id="log-in" className="nav-link" onClick={this._showLogin}>
            <i className='fas fa-user' /> Log In
          </a>
        </li>
      )
    }

    return (
      <li className="nav-item">
        <Dropdown
          className='user-dropdown nav-link'
          chosen={{ id: 'user' }}
          others={[{ id: 'logout' }]}
          onSelect={this._select}
          renderItem={this._item}
          keyProperty='id'
        />
      </li>
    )
  }

  _item (item) {
    if (item.id === 'user') {
      return (
        <span>
          <img
            className='user-avatar'
            height='13'
            width='13'
            src={`${gravatarUrl(authStore.user.email)}`}
          />
          {' '}{authStore.user.displayName}
        </span>
      )
    }

    return (
      <span>
        <i className='fas fa-sign-out-alt'></i>{' '}
        Log Out
      </span>
    )
  }

  _select = (item) => {
    if (item.id === 'logout') {
      authApi.logOut()
    }
  }

  _showLogin () {
    authStore.openLogin()
  }

  _openDocs (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io')
  }

  _openSupport (e) {
    e.preventDefault()
    ipc.externalOpen('https://on.cypress.io/support')
  }
}
