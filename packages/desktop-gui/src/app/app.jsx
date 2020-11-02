import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Loader from 'react-loader'

import appApi from '../lib/app-api'
import C from '../lib/constants'
import ipc from '../lib/ipc'
import appStore from '../lib/app-store'
import authApi from '../auth/auth-api'
import updateStore from '../update/update-store'
import viewStore from '../lib/view-store'

import Intro from './intro'
import Layout from './layout'
import Project from '../project/project'

@observer
class App extends Component {
  componentDidMount () {
    appApi.listenForMenuClicks()

    ipc.getOptions().then((options = {}) => {
      updateStore.setVersion(options.version)
      appStore.set(_.pick(options, 'cypressEnv', 'os', 'projectRoot', 'proxySource', 'proxyServer', 'proxyBypassList'))
      viewStore.showApp()
    })

    authApi.loadUser()
  }

  render () {
    switch (viewStore.currentView.name) {
      case C.LOADING:
        return <Loader color='#888' scale={0.5} />
      case C.INTRO:
        return (
          <Layout>
            <Intro />
          </Layout>
        )
      default:
        return (
          <Layout>
            <Project project={viewStore.currentView.project} app={appStore}/>
          </Layout>
        )
    }
  }
}

export default App
