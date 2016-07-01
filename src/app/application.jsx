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
  constructor (props) {
    App.ipc('get:current:user')
    .then(action('get:current:user', (user) => {
      state.setUser(user)
      if (this._userLoaded()) {
        getProjects()
      } else {
        this.props.router.push('/login')
      }
    }))

    super(props)
  }

  componentDidUpdate () {
    if (!this._userLoaded()) {
      this.props.router.push('/login')
    }
  }

  _userLoaded () {
    return !!(state.user) && !!(state.user.session_token)
  }

  render () {
    if (this._userLoaded() && projectsStore.isLoaded) {
      return (
        <Layout params={this.props.params}>
          {this.props.children}
        </Layout>
      )
    } else {
      return null
    }
  }
}
