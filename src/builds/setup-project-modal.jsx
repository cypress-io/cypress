import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import state from '../lib/state'
import App from '../lib/app'
import orgsStore from '../organizations/organizations-store'
import { gravatarUrl } from '../lib/utils'


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
      public: null,
      owner: null,
      orgId: null,
      showNameMissingError: false,
      isSubmitting: false,
    }
  }

  render () {
    if (!orgsStore.isLoaded) return null

    // const defaultOrg = _.find(orgsStore.orgs, { default: true })

    return (
      <BootstrapModal
        show={this.props.show}
        onHide={this.props.onHide}
        backdrop='static'
        >
        <div
          className='setup-project-modal modal-body os-dialog'
        >
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          <h4>Setup Project to Record</h4>
          <form
            onSubmit={this._submit}>
            <div className={cs('form-group', {
              'has-error': this.state.showNameMissingError && !this._hasValidProjectName(),
            })}>
              <div className='label-title'>
                <label htmlFor='projectName' className='control-label pull-left'>
                  What's the name of the project?
                </label>
                <p className='help-block pull-right'>(You can change this later)</p>
              </div>
              <div>
                <input
                  autoFocus='true'
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
          <hr />
            <div className='form-group'>
            <div className='label-title'>
                <label htmlFor='projectName' className='control-label pull-left'>
                  Who should own this project?
                </label>

              </div>
              <div className='owner-parts'>
                <div>
                  <div className='btn-group' data-toggle='buttons'>
                    <label className={`btn btn-default ${this.state.owner === 'me' ? 'active' : ''}`}>
                      <input
                        type='radio'
                        name='owner-toggle'
                        id='me'
                        autoComplete='off'
                        value='me'
                        checked={this.state.owner === 'me'}
                        onChange={this._updateOwner}
                        />
                        <img
                          className='user-avatar'
                          height='13'
                          width='13'
                          src={`${gravatarUrl(state.email)}`}
                        />
                        {' '}Me
                    </label>
                    <label className={`btn btn-default ${this.state.owner === 'org' ? 'active' : ''}`}>
                      <input
                        type='radio'
                        name='owner-toggle'
                        id='org'
                        autoComplete='off'
                        value='org'
                        checked={this.state.owner === 'org'}
                        onChange={this._updateOwner}
                        />
                        <i className='fa fa-building-o'></i>
                        {' '}An Organization
                    </label>
                  </div>
                </div>
                <div className='select-orgs'>
                  <div className={`${this.state.owner === 'org' && !orgsStore.orgs.length ? '' : 'hidden'}`}>
                    <div className='empty-select-orgs well'>
                      <p>You don't have any organizations yet.
                      </p>
                      <p>Organizations can help you manage projects, including billing.</p>
                      <p>
                        <a
                        href='#'
                        className={`btn btn-link  ${this.state.owner === 'org' ? '' : 'hidden'}`}
                        onClick={this._manageOrgs}>
                        <i className='fa fa-plus'></i>{' '}
                        Create Organization
                      </a>
                      </p>
                    </div>
                  </div>
                  <div className={`${this.state.owner === 'org' && orgsStore.orgs.length ? '' : 'hidden'}`}>
                    <select
                      ref='orgId'
                      id='organizations-select'
                      className='form-control float-left'
                      onChange={this._updateOrgId}
                      require={this.state.owner === 'org'}
                      >
                        <option>-- Select Organization --</option>

                        {_.map(orgsStore.orgs, (org) => {
                          if (org.default) return null

                          return (
                            <option
                              key={org.id}
                              value={org.id}
                              selected={this.state.orgId === org.id}
                            >
                              {org.name}
                            </option>
                          )
                        })}
                    </select>
                      <a
                      href='#'
                      className={`btn btn-link manage-orgs-btn float-left ${this.state.owner === 'org' ? '' : 'hidden'}`}
                      onClick={this._manageOrgs}>
                      (manage organizations)
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${this.state.orgId ? '' : 'hidden'}`}>
              <hr />
              <label htmlFor='projectName' className='control-label'>
                Who should see the builds and recordings?
              </label>
                <div className='radio privacy-radio'>
                  <label>
                    <input
                      type='radio'
                      name='privacy-radio'
                      value='true'
                      checked={(this.state.public === true)}
                      onChange={this._updateAccess}
                    />
                    <p>
                      <i className='fa fa-eye'></i>{' '}
                      <strong>Public:</strong>{' '}
                      Anyone has access.
                    </p>
                  </label>
                </div>
                <div className='radio privacy-radio'>
                  <label>
                    <input
                      type='radio'
                      name='privacy-radio'
                      value='false'
                      checked={(this.state.public === false)}
                      onChange={this._updateAccess}
                    />
                    <p>
                      <i className='fa fa-lock'></i>{' '}
                      <strong>Private:</strong>{' '}
                      Only invited users have access.
                      <br/>
                      <small className='help-block'>(Free while in beta, but will require a paid account in the future)</small>
                    </p>
                  </label>
                </div>
              </div>
            {this._error()}
            <div className='actions form-group'>
              <div className='pull-right'>
                <button
                  disabled={this.state.isSubmitting}
                  className='btn btn-primary btn-block'
                >
                  {
                    this.state.isSubmitting ?
                      <span><i className='fa fa-spin fa-refresh'></i>{' '}</span> :
                      null
                  }
                  <span>Setup Project</span>
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

  _updateOrgId = () => {
    let orgId = (this.refs.orgId.value === '-- Select Organization --') ? null : this.refs.orgId.value

    this.setState({
      orgId,
    })
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

  _updateOwner = (e) => {
    let owner = e.target.value

    const defaultOrg = _.find(orgsStore.orgs, { default: true })

    let chosenOrgId = (owner === 'me') ? defaultOrg.id : null

    // we want to clear all selects below the radio buttons
    // otherwise it looks jarring to already have selects
    this.setState({
      owner,
      orgId: chosenOrgId,
      public: null,
    })
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
      orgId: this.state.orgId,
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
