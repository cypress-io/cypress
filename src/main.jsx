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

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'
import state from './lib/state'
import projectsStore from './projects/projects-store'

const history = useRouterHistory(createHashHistory)({ queryKey: false })

const withUser = (ComponentClass) => {
  return observer((props) => {
    if (state.hasUser && projectsStore.isLoaded) {
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

App.start = () => {
  ipc('get:options')
  .then((options = {}) => {
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

    const el = document.getElementById('app')

    render(
      <Router history={history}>
        <Route path='/' component={Application} options={options}>
          <IndexRedirect to='/projects' />
          <Route path='/projects' component={withUser(Projects)} />
          <Route path='/projects/:id' component={withUser(Project)}>
            <IndexRedirect to='specs' />
            <Route path='config' component={withUser(Config)} />
            <Route path='specs' component={withUser(SpecsList)} />
          </Route>
          <Route path='/login' component={Login}/>
        </Route>
      </Router>
      , el
    )
  })
}
