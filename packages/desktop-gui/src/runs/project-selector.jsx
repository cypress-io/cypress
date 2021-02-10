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
    createNewProject: PropTypes.func.isRequired,
  }

  render () {
    const options = this._options()
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

  _createNewProject = (e) => {
    e.preventDefault()
    this.props.createNewProject()
  }

  _updateSelectedProject = (selectedOption) => {
    this.props.onUpdateSelectedProjectId(selectedOption.value)
  }
}

export default ProjectSelector
