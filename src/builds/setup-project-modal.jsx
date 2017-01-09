import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import BootstrapModal from 'react-bootstrap-modal'

import orgsStore from '../organizations/organizations-store'

@observer
class SetupProject extends Component {
  static propTypes = {
    project: React.PropTypes.object,
    show: React.PropTypes.bool.isRequired,
    onHide: React.PropTypes.func.isRequired,
    onSetup: React.PropTypes.func.isRequired,
  }

  constructor (...args) {
    super(...args)

    this.state = {
      error: null,
      projectName: this._initialProjectName(),
      public: true,
      showNameMissingError: false,
      isSubmitting: false,
    }
  }

  render () {
    if (!orgsStore.isLoaded) return null

    const defaultOrg = _.find(orgsStore.orgs, { default: true })

    return (
      <BootstrapModal
        show={this.props.show}
        onHide={this.props.onHide}
        backdrop='static'
        >
        <div
          className={cs('setup-project-modal modal-body os-dialog', {
            'is-submitting': this.state.isSubmitting,
          })}
        >
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          <h4>Setup Project for CI</h4>
          <p className='text-muted'>After configuring your project's settings, we will generate a CI key to be used during your CI run.</p>
          <form
            className='form-horizontal'
            onSubmit={this._submit}>
            <div className={cs('form-group', {
              'has-error': this.state.showNameMissingError && !this._hasValidProjectName(),
            })}>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Project Name:
              </label>
              <div className='col-sm-7'>
                <input
                  ref='projectName'
                  type='text'
                  className='form-control'
                  id='projectName'
                  value={this.state.projectName}
                  onChange={this._updateProjectName}
                />
              </div>
              <div className='help-block validation-error'>Please enter a project name</div>
            </div>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Organization:
              </label>
              <div className='col-sm-7'>
                <select
                  ref='orgId'
                  id='organizations-select'
                  className='form-control'>
                    <option value={defaultOrg.id}>{defaultOrg.name}</option>

                    {_.map(orgsStore.orgs, (org) => {
                      if (org.default) return null

                      return (
                        <option
                          key={org.id}
                          value={org.id}
                        >
                          {org.name}
                        </option>
                      )
                    })}
                </select>
              </div>
              <div className='col-sm-2 no-left-padding'>
                <button href='#' className='btn btn-link manage-orgs-btn' onClick={this._manageOrgs}>manage</button>
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Access:
              </label>
              <div className='col-sm-9'>
                <div className='radio privacy-radio'>
                  <label>
                    <input
                      type='radio'
                      name='privacy-radio'
                      value='true'
                      checked={this.state.public}
                      onChange={this._updateAccess}
                    />
                    <i className='fa fa-eye'></i>{' '}
                    <strong>Public</strong>
                    <p>Anyone can see the project's builds.</p>
                  </label>
                </div>
                <div className='radio privacy-radio'>
                  <label>
                    <input
                      type='radio'
                      name='privacy-radio'
                      value='false'
                      checked={!this.state.public}
                      onChange={this._updateAccess}
                    />
                    <i className='fa fa-lock'></i>{' '}
                    <strong>Private</strong>
                    <p>You choose who can see the project's builds.<br/>
                      <small className='text-muted'>(Free while in beta, but will require a paid account in the future)</small>
                    </p>
                  </label>
                </div>
              </div>
            </div>
            {this._error()}
            <div className='actions form-group'>
              <div className='col-sm-offset-8 col-sm-4'>
                <button
                  disabled={this.state.isSubmitting}
                  className='btn btn-primary'
                >
                  <span>Setup Project</span>
                  <i className='fa fa-spinner fa-spin'></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </BootstrapModal>
    )
  }

  _initialProjectName = () => {
    let project = this.props.project

    if (project.name) {
      return (project.name)
    } else {
      let splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _error () {
    const error = this.state.error
    if (!error) return null

    return (
      <div>
        <p className='text-danger'>An error occurred setting up your project:</p>
        <pre className='alert alert-danger'>{error.message}</pre>
      </div>
    )
  }

  _updateProjectName = () => {
    this.setState({
      projectName: this.refs.projectName.value,
    })
  }

  _hasValidProjectName () {
    return _.trim(this.state.projectName)
  }

  _manageOrgs = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/dashboard/settings')
  }

  _updateAccess = (e) => {
    this.setState({
      public: e.target.value === 'true',
    })
  }

  _submit = (e) => {
    e.preventDefault()

    if (this.state.isSubmitting) return

    if (this._hasValidProjectName()) {
      this.setState({
        isSubmitting: true,
      })
      this._setupProject()
    } else {
      this.setState({
        showNameMissingError: true,
      })
    }
  }

  _setupProject () {
    App.ipc('setup:ci:project', {
      projectName: this.state.projectName,
      orgId: this.refs.orgId.value,
      public: this.state.public,
    })
    .then((projectDetails) => {
      this.setState({
        isSubmitting: false,
      })
      this.props.onSetup(projectDetails)
      return null
    })
    .catch((error) => {
      this.setState({
        error,
        isSubmitting: false,
      })
    })
  }
}

export default SetupProject
