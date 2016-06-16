import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import ProjectsList from './projects-list'
import state from '../lib/state'
import App from '../lib/app'
import Tooltip from 'rc-tooltip'
import projectsStore from '../projects/projects-store'
import Promise from 'bluebird'

const logout = () => {
  App.ipc('log:out').then(action('log:out', () => {
    state.user = null
    App.ipc('clear:github:cookies')
  }))
}

const addProject = () => {
  let project

  App.ipc("show:directory:dialog")
  .then(action('add:project', (dirPath) => {
     // if the user cancelled the dialog selection
     // dirPath will be undefined
    if (!dirPath) return

    // initially set our project to be loading state
    project = projectsStore.addProject(dirPath)
    projectsStore.setChosen(project)

    // wait at least 750ms even if add:project
    // resolves faster to prevent the sudden flash
    // of loading content which is jarring
    Promise.all([
      App.ipc("add:project", dirPath),
      Promise.delay(750),
    ])
    .then(action('project:loaded', () => {
      project.isLoading = false
    }))
  }))
  .catch(action('add:project:err', (err) => {
    projectsStore.error = err.message
  }))
}

export default observer(() => {
  const hasProjects = !!projectsStore.projects.length
  const tooltip = hasProjects ? 'Add project' : 'Add a friggin project first!'

  return (
    <nav className="navbar navbar-inverse">
      <div className="container-fluid">
        <div className="collapse navbar-collapse">
          <ul className="nav navbar-nav">
            <ProjectsList />
            <li>
              <Tooltip
                placement="bottom"
                visible={!hasProjects}
                trigger={['hover']}
                overlay={tooltip}
                align={{
                  points: ['bl', 'tl'], // align bottom left point of sourceNode with top left point of targetNode
                }}
                >
                <a onClick={addProject} href="#">
                  <i className="fa fa-plus"></i>
                </a>
              </Tooltip>
            </li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                <i className="fa fa-user"></i>{" "}
                {state.user.displayName}{" "}
                <span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li><a href="#">Billing</a></li>
                <li role="separator" className="divider"></li>
                <li><a href="#" onClick={logout}>Log Out</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
})
