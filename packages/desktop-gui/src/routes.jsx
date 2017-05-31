import React from 'react'
import { Router, Route, useRouterHistory, IndexRedirect } from 'react-router'
import { observer } from 'mobx-react'
import { createHashHistory } from 'history'

import Layout from './app/layout'

import Application from './app/application'
import Runs from './runs/runs-list'
import Config from './config/config'
import Projects from './projects/projects-list'
import Project from './project/project'
import SpecsList from './specs/specs-list'

import state from './lib/state'
import projectsStore from './projects/projects-store'

const makeRoutes = () => {
  return (
    <Router history={history}>
      <Route path='/' component={Application}>
        <IndexRedirect to='/projects' />
        <Route path='/projects' component={withUser(Projects)} />
        <Route path='/projects/:clientId' component={withUser(Project)}>
          <IndexRedirect to='specs' />
          <Route path='specs' component={SpecsList} />
          <Route path='runs' component={Runs} />
          <Route path='config' component={Config} />
        </Route>
      </Route>
    </Router>
  )
}

export default makeRoutes
