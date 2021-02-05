import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Select from 'react-select'

@observer
class ProjectSelector extends Component {
  static propTypes = {
    projects: PropTypes.array.isRequired,
    selectedOrgId: PropTypes.string,
    selectedProjectId: PropTypes.string,
    onUpdateSelectedProjectId: PropTypes.func.isRequired,
    newProjectName: PropTypes.string,
    onUpdateNewProjectName: PropTypes.func.isRequired,
    newProject: PropTypes.bool,
    onUpdateNewProject: PropTypes.func.isRequired,
  }

  render () {
    const options = this._options()

    if (this.props.newProject || _.isEmpty(options)) {
      return (
        <div className='form-group'>
          <div className='label-title'>
            <label htmlFor='projectName' className='control-label pull-left'>
              What's the name of the project?
            </label>
            <p className='help-block pull-right'>(You can change this later)</p>
          </div>
          <div>
            <input
              autoFocus={true}
              ref='projectName'
              type='text'
              className='form-control'
              id='projectName'
              value={this.props.newProjectName}
              onChange={this._updateProjectName}
            />
          </div>
          { !_.isEmpty(options) && (
            <div className='input-link'>
              <a onClick={this._chooseExistingProject}>Choose an existing project</a>
            </div>
          )}
        </div>
      )
    }

    const selectedOption = _.find(options, { value: this.props.selectedProjectId })

    return (
      <div className='form-group'>
        <div className='label-title'>
          <label htmlFor='projectName' className='control-label pull-left'>
            Select a project
          </label>
        </div>
        <div>
          <Select
            className='project-select'
            classNamePrefix='project-select'
            value={selectedOption}
            onChange={this._updateSelectedProject}
            options={options}
          />
        </div>
        <div className='input-link'><a onClick={this._createNewProject}>Create new project</a></div>
      </div>
    )
  }

  _options () {
    return _.map(_.sortBy(this.props.projects, 'hasLastBuild'), (project) => {
      return {
        value: project.id,
        label: `${project.name} (${project.id})`,
      }
    })
  }

  _chooseExistingProject = (e) => {
    e.preventDefault()
    this.props.onUpdateNewProject(false)
  }

  _createNewProject = (e) => {
    e.preventDefault()
    this.props.onUpdateNewProject(true)
    this.props.onUpdateSelectedProjectId(null)
  }

  _updateProjectName = (e) => {
    this.props.onUpdateNewProjectName(e.target.value)
  }

  _updateSelectedProject = (selectedOption) => {
    this.props.onUpdateSelectedProjectId(selectedOption.value)
  }
}

export default ProjectSelector
