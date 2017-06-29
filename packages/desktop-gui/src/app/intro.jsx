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
        <div className='alert alert-info alert-dismissible'>
          <p>
            <i className='fa fa-info-circle'></i>{' '}
            We recommend installing Cypress locally per project. Just run <code>npm install --save-dev cypress</code> in your Console from the project you want to test.{' '}
            <a onClick={this._openHelp} className='helper-docs-link'>
              <i className='fa fa-question-circle' /> Need help?
            </a>
          </p>
          <button className="close" onClick={this._removeIntro}><span>&times;</span></button>
        </div>
        <div className='intro-content'>
          <h3>Add your project below to get started:</h3>
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
      </div>
    )
  }

  componentWillUnmount () {
    document.removeEventListener('dragover', this._nope)
    document.removeEventListener('drop', this._nope)
  }

  _removeIntro = () => {
    this.props.project.clearIntro()
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
