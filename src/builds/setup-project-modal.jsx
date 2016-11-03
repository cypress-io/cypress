import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

// import buildsCollection from './builds-collection'

@observer
class SetupProject extends Component {
  static propTypes = {
    project: React.PropTypes.bool.object,
    show: React.PropTypes.bool.isRequired,
    onHide: React.PropTypes.func.isRequired,
    onConfirm: React.PropTypes.func.isRequired,
  }

  render () {
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
                <select className='form-control'>
                  <option>Jane Lane</option>
                  <option>ACME Developers</option>
                </select>
              </div>
              <div className='col-sm-2 no-left-padding'>
                <button href='#' className='btn btn-link manage-orgs-btn' onClick=''>manage</button>
              </div>
            </div>
            <div className='form-group'>
              <label htmlFor='projectName' className='col-sm-3 control-label'>
                Access:
              </label>
              <div className='col-sm-9'>
                <div className='checkbox'>
                  <label>
                    <input type='checkbox'/>
                    Make Builds Private{' '}
                    <small>(Requires paid Cypress account)</small>
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
}

export default SetupProject
