import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { withRouter } from 'react-router'

import Layout from './layout'
import { getProjects } from '../projects/projects-api'
import projectsStore from '../projects/projects-store'

import App from '../lib/app'
import state from '../lib/state'

@withRouter
@observer
export default class Application extends Component {
  componentWillMount () {
    App.ipc('get:current:user')
    .then(action('get:current:user', (user) => {
      state.setUser(user)
      if (user) {
        getProjects()
      }
      this._checkAuth()
    }))
  }

  componentDidUpdate () {
    this._checkAuth()
  }

  _checkAuth () {
    if (this._isLackingUser()) {
      this.props.router.push('/login')
    }
  }

  _isLackingUser () {
    return !state.user || !state.user.session_token
  }

  _isLackingProjects () {
    return !projectsStore.projects.length
  }

  render () {
    if (this._isLackingUser() || this._isLackingProjects()) return null

    return (
      <Layout params={this.props.params}>
        {this.props.children}
      </Layout>
    )
  }
}
