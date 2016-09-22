import { useStrict } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { render } from 'react-dom'
import { Router, Route, useRouterHistory, IndexRedirect } from 'react-router'
import _ from 'lodash'
import { createHashHistory } from 'history'

import Application from './app/application'
import Login from './login/login'
import Projects from './projects/projects-list'
import Project from './project/project'
import SpecsList from './specs/specs-list'
import Config from './config/config'
import Layout from './app/layout'
import ApplyingUpdates from './applying_updates/applying_updates'
import Updates from './update/updates'

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'
import state from './lib/state'
import projectsStore from './projects/projects-store'

const history = useRouterHistory(createHashHistory)({ queryKey: false })

const withUser = (ComponentClass) => {
  return observer((props) => {
    if (state.userLoaded && projectsStore.isLoaded) {
      return (
        <Layout params={props.params}>
          <ComponentClass {...props} />
        </Layout>
      )
    } else {
      return null
    }
  })
}

const handleErrors = () => {
  const sendErr = function (err) {
    if (err) {
      return App.ipc('gui:error', _.pick(err, 'name', 'message', 'stack'))
    }
  }

  window.onerror = function (message, source, lineno, colno, err) {
    return sendErr(err)
  }

  window.onunhandledrejection = function (evt) {
    return sendErr(evt.reason)
  }
}

const setupState = (options) => {
  state.setVersion(options.version)
  state.listenForMenuClicks()
}

const getInitialRender = (updating) => {
  // if we are updating then do not start the app
  // start the updates being applied app so the
  // user knows its still a-happen-ning
  if (updating) {
    return (
      <ApplyingUpdates />
    )
  }

  return (
    <Router history={history}>
      <Route path='/' component={Application}>
        <IndexRedirect to='/projects' />
        <Route path='/projects' component={withUser(Projects)} />
        <Route path='/projects/:id' component={withUser(Project)}>
          <IndexRedirect to='specs' />
          <Route path='config' component={Config} />
          <Route path='specs' component={SpecsList} />
        </Route>
        <Route path='/login' component={Login}/>
      </Route>
    </Router>
  )
}

App.start = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()
    setupState(options)

    const el = document.getElementById('app')

    render(getInitialRender(options.updating), el)
  })
}

App.startUpdateApp = () => {
  ipc('get:options')
  .then((options = {}) => {

    handleErrors()

    const el = document.getElementById('updates')

    render(<Updates options={options}/>, el)
  })
}
