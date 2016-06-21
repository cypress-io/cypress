import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
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

const addProject = (e) => {
  if (e) { e.preventDefault() }

  let project

  return App.ipc("show:directory:dialog")
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
    return Promise.all([
      App.ipc("add:project", dirPath),
      // Promise.delay(750),
    ])
    .then(action('project:loaded', () => {
      return project.isLoading = false
    }))
  }))
  .catch(action('add:project:err', (err) => {
    projectsStore.error = err.message
  }))
}

export default observer(() => {
  const hasProjects = !!projectsStore.projects.length
  const tooltip = hasProjects ? 'Add Project' : 'Choose a folder to begin testing'

  return (
    <nav className='navbar navbar-inverse'>
      <div className='container-fluid'>
        <div className='collapse navbar-collapse'>
          <ul className='nav navbar-nav'>
          <li>
            <Tooltip
              placement='bottom'
              visible={!hasProjects}
              overlay={tooltip}
              align={{
                points: ['bl', 'tl'], // align bottom left point of sourceNode with top left point of targetNode
              }}
              >
              <a onClick={addProject} href='#'>
                <i className='fa fa-plus'></i>
              </a>
            </Tooltip>
          </li>
          </ul>
          <ul className='nav navbar-nav navbar-right'>
            <li className='dropdown'>
              <a href='#' className='dropdown-toggle' data-toggle='dropdown' role='button' aria-haspopup='true' aria-expanded='false'>
                <i className='fa fa-user'></i>{' '}
                {state.user.displayName}{' '}
                <span className='caret'></span>
              </a>
              <ul className='dropdown-menu'>
                <li>
                  <a href='#' onClick={logout}>
                    <i className="fa fa-sign-out"></i>{' '}
                    Log Out
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
})
