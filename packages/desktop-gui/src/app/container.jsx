import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { HashRouter as Router } from 'react-router-dom'
import Loader from 'react-loader'

import appApi from '../lib/app-api'
import C from '../lib/constants'
import ipc from '../lib/ipc'
import state from '../lib/state'

import App from './app'
import ApplyingUpdates from './applying-updates'
import Login from '../login/login'

@observer
export default class Application extends Component {
  componentDidMount () {

    // debugging code for url changes
    let url = window.location.href
    console.log(url)
    setInterval(() => {
      const newUrl = window.location.href
      if (url !== newUrl) {
        url = newUrl
        console.log(url)
      }
    }, 1000)
    // debugging code for url changes

    appApi.listenForMenuClicks()

    action('set:project:path', () => {
      state.projectPath = this.props.projectPath
    })()

    ipc.getOptions()
    .then(action('got:options', (options = {}) => {
      state.version = options.version

      if (options.updating) {
        state.appState = C.APPLYING_UPDATES
        // mobx can trigger a synchronous re-render, which executes
        // componentDidMount, etc in other components, making bluebird
        // think another promise was created but not returned
        // return null to prevent bluebird warning about it
        // same goes for other `return null`s below
        return null
      } else {
        state.appState = C.LOADING_USER
        return ipc.getCurrentUser()
      }
    }))
    .then(action('got:current:user', (user) => {
      if (state.appState === C.APPLYING_UPDATES) return

      state.setUser(user)
      state.appState = state.hasUser ? C.READY : C.NO_USER
      return null
    }))
    .catch(ipc.isUnauthed, () => {
      state.appState = C.NO_USER
      return null
    })
  }

  render () {
    return (
      <Router>{this._component()}</Router>
    )
  }

  _component () {
    switch (state.appState) {
      case C.LOADING_OPTIONS:
      case C.LOADING_USER:
        return <Loader color='#888' scale={0.5}/>
      case C.NO_USER:
        return <Login />
      case C.APPLYING_UPDATES:
        return <ApplyingUpdates />
      default:
        return <App isGlobal={this.props.isGlobal} />
    }
  }
}
