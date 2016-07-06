import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { Link } from 'react-router'
import { observer } from 'mobx-react'
import { ContextMenuLayer } from "react-contextmenu"

@observer
class Project extends Component {
  componentDidMount () {
    if (this.props.project.isLoading) {
      let link = findDOMNode(this.projectLink)
      link.scrollIntoView()
    }
  }

  render () {
    let project = this.props.project

    let loadingClassName = project.isLoading ? 'loading' : ''

    return (
      <Link
        ref={(ref) => this.projectLink = ref}
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
