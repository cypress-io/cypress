import React, { Component } from 'react'
import { observer } from 'mobx-react'

import RequestAccess from "./request-access-modal"

@observer
class PermissionMessage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      requestAccessModalOpen: false,
    }
  }

  render () {
    return (
      <div id='builds-list-page'>
        <div className="empty">
          <h4>
            Request access to see the builds
          </h4>
          <p>This is a private project created by someone else.</p>
          <p>The project owner must give you access to see the builds.</p>
          <button
            className='btn btn-primary'
            onClick={this._showSetupProjectModal}
            >
            <i className='fa fa-paper-plane'></i>{' '}
            Request Access
          </button>
        </div>
        <RequestAccess
          show={this.state.requestAccessModalOpen}
          onConfirm={this._requestAccess}
          onHide={this._hideRequestAccessModal}
        />
      </div>
    )
  }

  _hideSetupProjectModal () {
    this.setState({ requestAccessModalOpen: false })
  }

  _showSetupProjectModal = (e) => {
    e.preventDefault()
    this.setState({ requestAccessModalOpen: true })
  }

  _requestAccess = (e) => {
    e.preventDefault()
    // debugger
  }
}

export default PermissionMessage
