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
        <h1>To Get Started...</h1>
        <p>
          Run this command in your Console (or Terminal) in the project you want to test:
          <a onClick={this._openHelp} className='helper-docs-link pull-right'>
            <i className='fa fa-question-circle' /> Need help?
          </a>
        </p>
        <div>
          <pre><code>npm install this thang</code></pre>
        </div>
        <p>Or you can just drag your project here to run it:</p>
        <div
          className={cs('project-drop', { 'is-dragging-over': this.isDraggingOver })}
          onDragOver={this._dragover}
          onDragLeave={this._dragleave}
          onDrop={this._drop}
        >
          <i className='fa fa-cloud-upload'></i>
          <p>Drag your project here or <a href="#" onClick={this._selectProject}>select manually</a>.</p>
        </div>
        <ProjectsList onSelect={this._projectSelected} />
      </div>
    )
  }

  componentWillUnmount () {
    document.removeEventListener('dragover', this._nope)
    document.removeEventListener('drop', this._nope)
  }

  _selectProject = (e) => {
    e.preventDefault()
    ipc.showDirectoryDialog().then((path) => {
      if (!path) return // user cancelled

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
