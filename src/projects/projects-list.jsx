import App from '../lib/app'
import React, { Component } from 'react'
import projectsStore from '../projects/projects-store'
import { observer } from 'mobx-react'


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

class Projects  extends Component {
    // if (!projectsStore.projects.length) return

  // if (!projectsStore.chosen) return <NoChosenProject />
  render () {
    if (!projectsStore.projects.length) return <Empty />

    return <div>
        <h4>Projects</h4>
        { this._projects }
      </div>
  }
}

export default Projects

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


