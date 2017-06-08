import cs from 'classnames'
import React, { Component } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'

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
        <h2>Welcome to Cypress!</h2>
        <p>Verbiage about local Cypress usage</p>
        <p>Verbiage about local Cypress usage</p>
        <p>Verbiage about local Cypress usage</p>
        <p>
          <a onClick={this._openHelp} className='helper-docs-link'>
            <i className='fa fa-question-circle' /> Need help?
          </a>
        </p>
        <div
          className={cs('project-drop', { 'is-dragging-over': this.isDraggingOver })}
          onDragOver={this._dragover}
          onDragLeave={this._dragleave}
          onDrop={this._drop}
        >
          <p>Drag your project here</p>
          <p>- or -</p>
          <button className='btn btn-xs btn-black' onClick={this._selectProject}>Select Project</button>
        </div>
        <ProjectsList />
      </div>
    )
  }

  componentWillUnmount () {
    document.removeEventListener('dragover', this._nope)
    document.removeEventListener('drop', this._nope)
  }

  _selectProject = () => {
    ipc.showDirectoryDialog().then((path) => {
      if (!path) return // user cancelled

      return this._addProject(path)
    })
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

    const file = e.dataTransfer.files[0]
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
    ipc.externalOpen('https://on.cypress.io/adding-new-project')
  }
}

export default Default
