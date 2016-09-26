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
        <div className='modal-body'>
          <form onSubmit={this.props.onConfirm}>
          foobar
          </form>
        </div>
      </BootstrapModal>
    )
  }
}

export default SetupProject
