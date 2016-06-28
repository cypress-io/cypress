import React, { Component } from 'react'
import { Link } from 'react-router'
import { ContextMenuLayer } from "react-contextmenu"

class Project extends Component {
  render () {
    let project = this.props.project

    let loadingClassName = project.isLoading ? 'loading' : ''

    return (
      <Link
        className={`project ${loadingClassName}`}
        to={`/projects/${project.id}`}
        >
        <div className="row-column-wrapper">
          <div className="row-column">
            <div className='project-name'>
              <i className="fa fa-folder"></i>{" "}
              { project.name }{' '}
            </div>
            <div className='project-path'>{ project.displayPath }</div>
          </div>
        </div>
        <div className="row-column-wrapper">
          <i className="fa fa-chevron-right"></i>
        </div>
      </Link>
    )
  }
}

export default ContextMenuLayer("context-menu", (props) => {
  return props.project
})(Project)
