import _ from 'lodash'
import cs from 'classnames'
import React, { Component } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'

import appStore from '../lib/app-store'
import ipc from '../lib/ipc'
import projectsApi from '../projects/projects-api'
import viewStore from '../lib/view-store'

import ProjectsList from '../projects/projects-list'

@observer
class Default extends Component {
  @observable isDraggingOver

  componentDidMount () {
    // silly idiosyncrancies of the drag-n-drop API
    document.addEventListener('dragover', this._nope)
    document.addEventListener('drop', this._nope)
  }

  render () {
    return (
      <div className='intro'>
        {this._localNotice()}
        <div className='intro-content'>
          <h1>To get started...</h1>
          <div
            className={cs('project-drop', { 'is-dragging-over': this.isDraggingOver })}
            onDragOver={this._dragover}
            onDragLeave={this._dragleave}
            onDrop={this._drop}
          >
            <span className="fa-stack fa-lg">
              <i className="fas fa-folder fa-stack-2x"></i>
              <i className="fas fa-plus fa-stack-1x"></i>
            </span>
            <p>Drag your project here or <a href="#" onClick={this._selectProject}>select manually</a>.</p>
          </div>
          <ProjectsList onSelect={this._projectSelected} />
        </div>
      </div>
    )
  }

  _localNotice () {
    if (appStore.localInstallNoticeDismissed) return null

    return (
      <div className='local-install-notice alert alert-info alert-dismissible'>
        <p className='text-center'>
          <i className='fas fa-info-circle'></i>{' '}
          We recommend versioning Cypress per project and{' '}
          <a onClick={this._openHelp} className='helper-docs-link'>
            installing it via <span className='mono'>npm</span>
          </a>.
        </p>
        <button className="close" onClick={this._removeGlobalIntro}><span>&times;</span></button>
      </div>
    )
  }

  componentWillUnmount () {
    document.removeEventListener('dragover', this._nope)
    document.removeEventListener('drop', this._nope)
  }

  _removeGlobalIntro = () => {
    appStore.setLocalInstallNoticeDismissed(true)
  }

  _selectProject = (e) => {
    e.preventDefault()
    ipc.showDirectoryDialog().then((path) => {
      if (!path) return // user canceled

      return this._addProject(path)
    })
  }

  _projectSelected = (project) => {
    projectsApi.addProject(project.path)
  }

  _addProject (path) {
    projectsApi.addProject(path).then((project) => {
      viewStore.showProjectSpecs(project)
    })
  }

  _dragover = () => {
    this._setDragging(true)

    return false
  }

  _dragleave = () => {
    this._setDragging(false)

    return false
  }

  _drop = (e) => {
    e.preventDefault()
    this._setDragging(false)

    const file = _.get(e, 'dataTransfer.files[0]')

    if (!file) return false

    this._addProject(file.path)

    return false
  }

  @action _setDragging = (isDraggingOver) => {
    this.isDraggingOver = isDraggingOver
  }

  _nope (e) {
    e.preventDefault()

    return false
  }

  _openHelp () {
    ipc.externalOpen('https://on.cypress.io/installing-via-npm')
  }
}

export default Default
