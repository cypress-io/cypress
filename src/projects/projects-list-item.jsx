import _ from 'lodash'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { Link } from 'react-router'
import { observer } from 'mobx-react'
import { ContextMenuLayer } from "react-contextmenu"

const strLength = 75

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
              { this._projectName()}
            </div>
            <div className='project-path'>
              { this._displayPath() }
            </div>
          </div>
        </div>
        <div className="row-column-wrapper">
          { this._icon() }
        </div>
      </Link>
    )
  }

  _projectName = () => {
    let project = this.props.project

    if (project.name) {
      return (project.name)
    } else {
      let splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _displayPath = () => {
    let path = this.props.project.path
    let pathLength = path.length

    if (pathLength > strLength) {
      let truncatedPath = path.slice((pathLength - 1) - strLength, pathLength)
      return '...'.concat(truncatedPath)
    } else {
      return path
    }
  }

  _icon = () => {
    if (this.props.project.isLoading) {
      return (
        <i className="fa fa-spinner fa-pulse"></i>
      )
    } else {
      return (
        <i className="fa fa-chevron-right"></i>
      )
    }
  }
}

export default ContextMenuLayer("context-menu", (props) => {
  return props.project
})(Project)
