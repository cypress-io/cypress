import React, { Component } from 'react'
import { Dropdown } from '@packages/ui-components'

import appStore from '../lib/app-store'
import authStore from '../auth/auth-store'
import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'
import { gravatarUrl } from '../lib/utils'
import { Link, routes } from '../lib/routing'
import DocsMenu from './docs-menu'
import { gql } from '@apollo/client'
import { NavFragment } from '../generated/graphql'

gql`
fragment Nav on Query {
  app {
    updateAvailable
    latestCypressVersion
  }
  currentProject {
    id
    displayName
  }
  # currentUser {
  #   id
  #   displayName
  #   email
  # }
}
`

class Nav extends Component<{ data: NavFragment }> {
  render () {
    return (
      <nav className='main-nav navbar navbar-inverse'>
        <ul className='nav'>
          <li>
            {this._leftNav()}
          </li>
        </ul>
        <div className='spacer' />
        <ul className='nav'>
          <li>
            <a onClick={this._openSupport} href='#'>
              <i className='fas fa-question-circle' /> Support
            </a>
          </li>
          <DocsMenu />
          {this._userStateButton()}
        </ul>
      </nav>
    )
  }

  _leftNav = () => {
    const project = viewStore.currentView.project

    // project mode
    if (!appStore.isGlobalMode) {
      return <div>{this.props.data.currentProject?.displayName}</div>
    }

    // global mode, on project page
    if (appStore.isGlobalMode && project) {
      return (
        <Link to={routes.intro()}>
          <i className='fas fa-chevron-left' /> Back
        </Link>
      )
    }

    // global mode, on intro page
    return (
      <div className='logo'>
        <img src={require('@cypress/icons/dist/logo/cypress-inverse.png')} alt="Cypress" />
      </div>
    )
  }

  _userStateButton = () => {
    if (authStore.isLoading) {
      return (
        <li>
          <div>
            <i className='fas fa-user' /> <i className='fas fa-spinner fa-spin' />
          </div>
        </li>
      )
    }

    if (!this.props.data.currentUser) {
      return (
        <li>
          <a onClick={this._showLogin}>
            <i className='fas fa-user' /> Log In
          </a>
        </li>
      )
    }

    return (
      <Dropdown
        className='user-dropdown'
        chosen={{ id: 'user' }}
        others={[{ id: 'logout' }]}
        onSelect={this._select}
        renderItem={this._item}
        keyProperty='id'
      />
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
            src={`${gravatarUrl(this.props.data.currentUser?.email ?? '')}`}
          />
          {' '}{this.props.data.currentUser?.displayName}
        </span>
      )
    }

    return (
      <span>
        <i className='fas fa-sign-out-alt' />{' '}
        Log Out
      </span>
    )
  }

  _select = (item) => {
    if (item.id === 'logout') {
      // TODO: Tim: Logout mutation
      // authApi.logOut()
    }
  }

  _showLogin () {
    authStore.openLogin(null, 'Nav')
  }

  _openSupport (e) {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/support',
      params: {
        utm_medium: 'Nav',
        utm_campaign: 'Support',
      },
    })
  }
}

export default Nav
