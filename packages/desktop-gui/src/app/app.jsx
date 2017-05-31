import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'

// import appApi from '../lib/app-api'
// import { getProjects } from '../projects/projects-api'
// import ipc from '../lib/ipc'
import state from '../lib/state'

import Layout from './layout'
import ProjectsList from '../projects/projects-list'
import Project from '../project/project'

@observer
class App extends Component {
  render () {
    return (
      <Layout>
        <Switch>
          <Route exact path='/projects' component={ProjectsList} />
          <Route path='/projects/:projectPath' component={Project} />
          <Route to={state.projectPath ? `/projects/${state.projectPathUri}` : '/projects'} />
        </Switch>
      </Layout>
    )
  }
}

export default App
