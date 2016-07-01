import { useStrict } from 'mobx'
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

useStrict(true)

import App from './lib/app'
import ipc from './lib/ipc'

const history = useRouterHistory(createHashHistory)({ queryKey: false })

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
          <Route path='/projects' component={Projects} />
          <Route path='/projects/:id' component={Project}>
            <IndexRedirect to='specs' />
            <Route path='config' component={Config} />
            <Route path='specs' component={SpecsList} />
          </Route>
        </Route>
        <Route path='/login' component={Login}/>
      </Router>
      , el
    )
  })
}
