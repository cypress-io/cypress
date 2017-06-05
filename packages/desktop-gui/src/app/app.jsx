import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Loader from 'react-loader'

import appApi from '../lib/app-api'
import C from '../lib/constants'
import ipc from '../lib/ipc'
import appStore from '../lib/app-store'
import authStore from '../lib/auth-store'
import viewStore from '../lib/view-store'

import ApplyingUpdates from './applying-updates'
import Layout from './layout'
import Login from '../login/login'
import ProjectsList from '../projects/projects-list'
import Project from '../project/project'

@observer
class App extends Component {
  componentDidMount () {
    appApi.listenForMenuClicks()

    appStore.setProjectPath(this.props.projectPath)

    ipc.getOptions()
    .then(action('got:options', (options = {}) => {
      appStore.version = options.version

      if (options.updating) {
        viewStore.showApplyingUpdates()
        // mobx can trigger a synchronous re-render, which executes
        // componentDidMount, etc in other components, making bluebird
        // think another promise was created but not returned
        // return null to prevent bluebird warning about it
        // same goes for other `return null`s below
        return null
      } else {
        return ipc.getCurrentUser()
      }
    }))
    .then(action('got:current:user', (user) => {
      if (viewStore.isApplyingUpdates()) return
      authStore.setUser(user)
      return null
    }))
    .catch(ipc.isUnauthed, () => {
      viewStore.showLogin()
      return null
    })
  }

  render () {
    switch (viewStore.currentView.name) {
      case C.LOADING:
        return <Loader color='#888' scale={0.5} />
      case C.LOGIN:
        return <Login />
      case C.APPLYING_UPDATES:
        return <ApplyingUpdates />
      case C.PROJECTS:
        return (
          <Layout>
            <ProjectsList />
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
