import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

// import buildsCollection from './builds-collection'

@observer
class SetupProject extends Component {
  static propTypes = {
    projectId: React.PropTypes.bool.string,
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
          <form
            className="form-horizontal"
            onSubmit={this.props.onConfirm}>
            <div className="form-group">
              <label for="projectName" className="col-sm-4 control-label">
                Project Name:
              </label>
              <div className="col-sm-8">
                <input type="text" className="form-control" id="projectName" />
              </div>
            </div>
            <div className="form-group">
              <label for="projectName" className="col-sm-4 control-label">
                Account:
              </label>
              <div className="col-sm-8">
                <input type="text" className="form-control" id="projectName" />
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-offset-4 col-sm-8">
                <div className="checkbox">
                  <label>
                    <input type="checkbox"/> Make Builds Private
                  </label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-offset-4 col-sm-8">
                <button type="submit" className="btn btn-primary btn-sm">
                  Setup Project
                </button>
              </div>
            </div>
          </form>
        </div>
      </BootstrapModal>
    )
  }
}

export default SetupProject
