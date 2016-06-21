import _ from 'lodash'
import App from '../lib/app'
import React, { Component } from 'react'
import { Link } from 'react-router'
import { observer } from 'mobx-react'

import projectsStore from '../projects/projects-store'

const Empty = () => (
  <div className='empty'>
    <h4>Add your first project</h4>
    <p>To begin testing, click <i className='fa fa-plus'></i> above to choose a folder that has the resources of your project.</p>
    <p>Often this is the root folder of a source controlled project.</p>
    <Error />
    <p className='helper-docs-append'>
      <a onClick={openHelp} className='helper-docs-link'>
        <i className='fa fa-question-circle'></i>{' '}
        Need help?
      </a>
    </p>
  </div>
)

const Error = observer(() => {
  return (
    <div className='alert alert-danger error'>
      <p className='text-center'>
        <i className='fa fa-exclamation-triangle'></i>{' '}
        { projectsStore.error }
      </p>
    </div>
  )
})

const openHelp = () => (
  App.ipc('external:open', 'https://on.cypress.io/guides/installing-and-running/#section-adding-projects')
)

// const NoChosenProject = () => (
//   <div className='well-message'>
//     <h4>Choose a Project</h4>
//     <p>Choose an existing project to test.</p>
//     <Error />
//     <p className='helper-docs-append'>
//       <a onClick={openHelp} className='helper-docs-link'>
//         <i className='fa fa-question-circle'></i>{' '}
//         Need help?
//       </a>
//     </p>
//   </div>
// )


export default class Projects extends Component {
    // if (!projectsStore.projects.length) return

  // if (!projectsStore.chosen) return <NoChosenProject />
  render () {
    if (!projectsStore.projects.length) return <Empty />

    return <ul class='projects-list'>
        { _.map(projectsStore.projects, (project) => (
            this._project(project)
        ))}
      </ul>

  }
  _project = (project) => {
    if (project.empty) {
      return (
        <span>Projects</span>
      )
    } else {
      return (
        <li>
          <Link
            to={`/projects/${project.id}`}
            >
            <div className='project-name'>
              <i className="fa fa-folder"></i>{" "}
              { project.name }
            </div>
            <div className='project-path'>{ project.displayPath }</div>
          </Link>
        </li>
      )
    }
  }
}
