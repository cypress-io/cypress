import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

// import buildsCollection from './builds-collection'

@observer
class RequestAccess extends Component {
  static propTypes = {
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
        <div className='modal-body'>
          <div className='empty-onboarding'>
            <h3>Request Sent</h3>
            <p>
              An email has been sent to the project owner to request access to this project's builds.
            </p>
            <BootstrapModal.Dismiss className='btn btn-success'>
              OK, got it!
            </BootstrapModal.Dismiss>
          </div>
        </div>
      </BootstrapModal>
    )
  }
}

export default RequestAccess
