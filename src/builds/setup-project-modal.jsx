import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import BootstrapModal from 'react-bootstrap-modal'

import orgsStore from '../organizations/organizations-store'

@observer
class SetupProject extends Component {
  static propTypes = {
    project: React.PropTypes.bool.object,
    show: React.PropTypes.bool.isRequired,
    onHide: React.PropTypes.func.isRequired,
    onConfirm: React.PropTypes.func.isRequired,
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
        <div className='modal-body os-dialog'>
          <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          <h4>Setup Project for CI</h4>
          <p className='text-muted'>After configuring your project's settings, we will generate a secret key to be used during your CI run.</p>
          <form
            className='form-horizontal'
            onSubmit={this.props.onConfirm}>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Project Name:
              </label>
              <div className='col-sm-7'>
                <input
                  type='text'
                  className='form-control'
                  id='projectName'
                  defaultValue={this._projectName()}/>
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Organization:
              </label>
              <div className='col-sm-7'>
                <select
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
                <button href='#' className='btn btn-link manage-orgs-btn' onClick={this._manageOrgsLink}>manage</button>
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Access:
              </label>
              <div className='col-sm-9'>
                <div className='radio privacy-radio'>
                  <label>
                    <input type='radio' name='privacy-radio' value='true' />
                    <i className='fa fa-eye'></i>{' '}
                    <strong>Public</strong>
                    <p>Anyone can see the project's builds.</p>
                  </label>
                </div>
                <div className='radio privacy-radio'>
                  <label>
                    <input type='radio' name='privacy-radio' value='false'/>
                    <i className='fa fa-lock'></i>{' '}
                    <strong>Private</strong>
                    <p>You choose who can see the project's builds.
                      <small>(Requires paid Cypress account)</small>
                    </p>
                  </label>
                </div>
              </div>
            </div>
            <div className='form-group'>
              <div className='col-sm-offset-8 col-sm-4'>
                <button type='submit' className='btn btn-primary'>
                  Setup Project
                </button>
              </div>
            </div>
          </form>
        </div>
      </BootstrapModal>
    )
  }

  _projectName = () => {
    let project = this.props.project

    if (project.name) {
      return (project.name)
    } else {
      let splitName = _.last(project.path.split('/'))
      return _.truncate(splitName, { length: 60 })
    }
  }

  _manageOrgsLink = (e) => {
    e.preventDefault()
    App.ipc('external:open', 'https://app.cypress.io')
  }
}

export default SetupProject
