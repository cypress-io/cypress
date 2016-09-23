import React from 'react'
import { Router, Route, useRouterHistory, IndexRedirect } from 'react-router'
import { observer } from 'mobx-react'
import { createHashHistory } from 'history'
import DevTools, { setLogEnabled, setUpdatesEnabled, setGraphEnabled } from 'mobx-react-devtools'

import Layout from './app/layout'

import Application from './app/application'
import Login from './login/login'
import Projects from './projects/projects-list'
import Project from './project/project'
import SpecsList from './specs/specs-list'
import Config from './config/config'
import ApplyingUpdates from './applying_updates/applying_updates'

import state from './lib/state'
import projectsStore from './projects/projects-store'

const history = useRouterHistory(createHashHistory)({ queryKey: false })

const withUser = (ComponentClass) => {
  return observer((props) => {
    if (state.userLoaded && projectsStore.isLoaded) {
      return (
        <Layout params={props.params}>
          <ComponentClass {...props} />
          {devTools()}
        </Layout>
      )
    } else {
      return null
    }
  })
}

const devTools = () => {
  if ((window.env === 'development') || (window.env === 'test')) {
    setLogEnabled(true)
    setUpdatesEnabled(true)
    setGraphEnabled(false)

    return <DevTools position={{ bottom: 0, left: 20 }}/>
  }
}

const makeRoutes = (updating) => {
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

export default makeRoutes
