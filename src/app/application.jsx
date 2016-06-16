import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import Layout from './layout'
import Project from '../project/project'
import Login from '../login/login'

import App from '../lib/app'
import state from '../lib/state'

@observer
export default class Application extends Component {
  componentWillMount () {
    App.ipc('get:current:user')
    .then(action('get:current:user', (user) => {
      state.setUser(user)
    }))
  }

  render () {
    if (!state.user || !state.user.session_token) return <Login />

    return (
      <Layout>
        <Project />
      </Layout>
    )
  }
}
