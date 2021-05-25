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

const docsMenuContent = [{
  title: 'Get Started',
  children: [{
    text: 'Write your first test',
    link: 'https://on.cypress.io',
  }, {
    text: 'Testing your app',
    link: 'https://on.cypress.io',
  }],
}, {
  title: 'References',
  children: [{
    text: 'Best practices',
    link: 'https://on.cypress.io',
  }, {
    text: 'Configuration',
    link: 'https://on.cypress.io',
  }, {
    text: 'API',
    link: 'https://on.cypress.io',
  }],
}, {
  title: 'Optimize Cypress in CI',
  children: [{
    text: 'Setting up CI',
    link: 'https://on.cypress.io',
  }, {
    text: 'Debugging failed tests',
    link: 'https://on.cypress.io',
  }, {
    text: 'Running tests faster',
    link: 'https://on.cypress.io',
  }],
}]

@observer
export default class Nav extends Component {
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
          {this._docsMenu()}
          {this._userStateButton()}
        </ul>
      </nav>
    )
  }

  _leftNav = () => {
    const project = viewStore.currentView.project

    // project mode
    if (!appStore.isGlobalMode) {
      return <div>{project && project.displayName}</div>
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

  _docsMenu = () => {
    return (
      <li className='docs-menu'>
        <a onClick={this._openDocs} href='#'>
          <i className='fas fa-graduation-cap' /> Docs
        </a>
        <div className='docs-dropdown'>
          {docsMenuContent.map(({ title, children }) => (
            <ul className='dropdown-column' key={title}>
              <li className='column-title'>{title}</li>
              {children.map((item) => (
                <li className='column-item' key={item.text}>
                  <a onClick={(e) => this._handleDocsClick(e, item)}><i className='far fa-file-alt' /><span>{item.text}</span><i className='fas fa-long-arrow-alt-right' /></a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </li>
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

    if (!authStore.isAuthenticated) {
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
            src={`${gravatarUrl(authStore.user.email)}`}
          />
          {' '}{authStore.user.displayName}
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
      authApi.logOut()
    }
  }

  _showLogin () {
    authStore.openLogin(null, 'Nav')
  }

  _handleDocsClick = (e, item) => {
    e.preventDefault()

    if (item.action) {
      item.action()
    }

    if (item.link) {
      ipc.externalOpen(item.link)
    }
  }

  _openDocs (e) {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/docs',
      params: {
        utm_medium: 'Nav',
        utm_campaign: 'Docs',
      },
    })
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
