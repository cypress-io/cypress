import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { Link } from 'react-router'
import { observer } from 'mobx-react'
import { ContextMenuLayer } from 'react-contextmenu'

import { getStatusIcon } from '../lib/utils'

const strLength = 45

@observer
class Project extends Component {
  componentDidMount () {
    if (this.props.project.isLoading) {
      const link = findDOMNode(this.projectLink)
      link.scrollIntoView()
    }
  }

  render () {
    const project = this.props.project

    const loadingClassName = project.isLoading ? 'loading' : ''

    let link = `/projects/${project.clientId}`
    if (!project.valid) {
      link += '/builds'
    }

    return (
      <Link
        ref={(ref) => this.projectLink = ref}
        className={`project ${loadingClassName}`}
        to={link}
        >
        <div className='row-column-wrapper'>
          <div className='row-column'>
            <div className='project-name'>
              <i className='fa fa-folder'></i>{' '}
              { this._projectName() }
              { this._public() }
            </div>
            <div className='project-path'>
              { this._displayPath() }
            </div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          <div className='row-column'>
            <div className='project-status'>
              { this._projectStatus() }
            </div>
            <div className='project-time'>
              { this._projectTime() }
            </div>
          </div>
        </div>
        <div className='row-column-wrapper'>
          { this._icon() }
        </div>
      </Link>
    )
  }

  _projectName () {
    const project = this.props.project

    if (project.name) {
      return (project.name)
    } else {
      const splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _public () {
    if (this.props.project.public) {
      return (
        <span className='label label-warning'>Public</span>
      )
    }
  }

  _projectOwner () {
    const project = this.props.project

    if (!project.orgName) return

    const iconClass = project.defaultOrg ? 'user' : 'building'

    return (
      <span>
        <i className={`fa fa-${iconClass}`}></i>{' '}
        {project.orgName}
      </span>
    )
  }

  _displayPath () {
    const path = this.props.project.path
    const pathLength = path.length

    if (pathLength > strLength) {
      const truncatedPath = path.slice((pathLength - 1) - strLength, pathLength)
      return '...'.concat(truncatedPath)
    } else {
      return path
    }
  }

  _projectStatus () {
    if (!this.props.project.valid) {
      return (
        <span className='invalid'>
          <i className={`fa fa-warning`}></i>{' '}
          Invalid
        </span>
      )
    }

    const status = this.props.project.lastBuildStatus
    if (!status) return

    return (
      <span className={`${status}`}>
        <i className={`fa ${status} fa-${getStatusIcon(status)}`}></i>{' '}
        {_.startCase(status)}
      </span>
    )
  }

  _projectTime () {
    const lastRan = this.props.project.lastBuildCreatedAt

    if (!lastRan) return

    if (this.props.project.lastBuildStatus === 'running') {
      return "Now..."
    }

    return (
      <span>
        {moment(lastRan).fromNow()}
      </span>
    )
  }

  _icon () {
    if (this.props.project.isLoading) {
      return (
        <i className='fa fa-spinner fa-pulse'></i>
      )
    } else {
      return (
        <i className='fa fa-chevron-right'></i>
      )
    }
  }
}

export default ContextMenuLayer('context-menu', (props) => {
  return props.project
})(Project)
