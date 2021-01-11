import _ from 'lodash'
import cs from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Loader from 'react-loader'
import Select from 'react-select'

@observer
class ProjectSelector extends Component {
  static propTypes = {
    projects: PropTypes.array.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    selectedProjectId: PropTypes.string,
    onCreateProject: PropTypes.func.isRequired,
    onUpdateSelectedProjectId: PropTypes.func.isRequired,
  }

  render () {
    const { isLoaded, projects } = this.props

    if (!isLoaded) {
      return <Loader color='#888' scale={0.5} />
    }

    if (!projects.length) {
      return (
        <div className='empty-select-projects well'>
          <p>You don't have any projects yet.</p>
          <p>Projects can help you lorem ipsum blah blah blah.</p>
          <p>
            <a
              href='#'
              className='btn btn-link'
              onClick={this.props.onCreateProject}>
              <i className='fas fa-plus'></i>{' '}
              Create project
            </a>
          </p>
        </div>
      )
    }

    const options = this._options()
    const selectedOption = _.find(options, { value: this.props.selectedProjectId })

    return (
      <div className={cs({ hidden: !projects.length })}>
        <Select
          className='projects-select'
          classNamePrefix='projects-select'
          value={selectedOption}
          onChange={this._handleChange}
          isLoading={!this.props.isLoaded}
          options={options}
        />
      </div>
    )
  }

  _options () {
    return _.map(this.props.projects, (project) => {
      return {
        value: project.id,
        default: project.default,
        label: this._getOptionLabel(project),
      }
    })
  }

  _getOptionLabel (project) {
    return project.name
  }

  _handleChange = (selectedOption) => {
    const selectedProjectId = selectedOption.value

    this.props.onUpdateSelectedProjectId(selectedProjectId)
  }
}

export default ProjectSelector
