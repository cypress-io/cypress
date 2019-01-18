import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import appApi from '../lib/app-api'
import C from '../lib/constants'
import ipc from '../lib/ipc'
import appStore from '../lib/app-store'
import authApi from '../auth/auth-api'
import viewStore from '../lib/view-store'

import Intro from './intro'
import Layout from './layout'
import Loader from '../lib/loader'
import Project from '../project/project'

@observer
class App extends Component {
  componentDidMount () {
    appApi.listenForMenuClicks()

    ipc.getOptions().then((options = {}) => {
      appStore.set(_.pick(options, 'cypressEnv', 'os', 'projectRoot', 'version'))
      viewStore.showApp()
    })

    authApi.loadUser()
  }

  render () {
    switch (viewStore.currentView.name) {
      case C.LOADING:
        return <Loader fullscreen />
      case C.INTRO:
        return (
          <Layout>
            <Intro />
          </Layout>
        )
      default:
        return (
          <Layout>
            <Project project={viewStore.currentView.project} />
          </Layout>
        )
    }
  }
}

export default App
