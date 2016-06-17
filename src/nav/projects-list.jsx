import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import projectsStore from '../projects/projects-store'
import Dropdown from '../dropdown/dropdown'
import { getProjects, openProject, closeProject } from '../projects/projects-api'

@observer
export default class ProjectsList extends Component {
  componentWillMount () {
    getProjects()
  }

  render () {
    if (!projectsStore.projects.length) return null

    const chosen = projectsStore.chosen || { empty: true }
    const other = projectsStore.other.concat([{ add: true }])

    return (
      <Dropdown
        className='projects-list'
        icon='folder-open'
        chosen={chosen}
        others={other}
        onSelect={this._onSelect}
        renderItem={this._project}
        keyProperty='path'
      />
    )
  }

  _onSelect = (project) => {
    if (project.add) {
      this.props.addProject()
    } else {
      if (projectsStore.chosen) {
        action('close:project', () =>
          closeProject()
          .then(() => {
            this._selectProject(project)
          })
        )()
      } else {
        this._selectProject(project)
      }
    }
  }

  _selectProject = (project) => {
    action('project:selected', () => openProject(project))()
  }

  _project = (project) => {
    if (project.empty) {
      return (
        <span>Projects</span>
      )
    } else if (project.add) {
      return (
        <a className='add-project' href="#">
          <i className="fa fa-plus"></i>{" "}
          Add Project
        </a>
      )
    } else if (project.isChosen) {
      return (
        <span>{project.name}</span>
      )
    } else {
      return (
        <a href="#">
          <div className='project-name'>
            <i className="fa fa-folder"></i>{" "}
            { project.name }
          </div>
          <div className='project-path'>{ project.displayPath }</div>
        </a>
      )
    }
  }
}
