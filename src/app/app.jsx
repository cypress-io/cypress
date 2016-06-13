import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import Layout from './layout'
import ProjectNav from '../project-nav/project-nav'
import Login from '../login/login'

import AppGlobal from '../lib/app'
import state from '../lib/state'

@observer
export default class App extends Component {
  componentWillMount () {
    AppGlobal.ipc('get:current:user').then(action('get:current:user', (user) => {
      state.setUser(user)
    }))
  }

  render () {
    if (!state.user || !state.user.session_token) return <Login />

    return (
      <Layout>
        <ProjectNav />
      </Layout>
    )
  }
}
