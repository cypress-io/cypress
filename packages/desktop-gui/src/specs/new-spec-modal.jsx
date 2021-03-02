import { observer } from 'mobx-react'
import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'

import specsStore from './specs-store'
import ipc from '../lib/ipc'

const fileExtensionRegex = /^([^\\]*)\.(\w+)$/

@observer
class NewSpecModal extends Component {
  constructor (props) {
    super(props)

    this.state = {
      fileName: this._generateFileName(),
    }
  }

  render () {
    return (
      <BootstrapModal
        show={specsStore.newSpecModalIsOpen}
        onHide={specsStore.toggleNewSpecModal}
      >
        <BootstrapModal.Header>
          <BootstrapModal.Title>
            Create New Spec File
            <BootstrapModal.Dismiss className='btn btn-link close'>x</BootstrapModal.Dismiss>
          </BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body className='new-spec-modal'>
          <label>File Name</label>
          <input type='text' value={this.state.fileName} onChange={this._onInput} onFocus={this._setUserSelection} autoFocus />
          <button onClick={this._createFile}>Create</button>
        </BootstrapModal.Body>
      </BootstrapModal>
    )
  }

  _generateFileName = () => {
    // TODO: look at filesystem to determine name
    return 'untitled_spec.js'
  }

  _onInput = (e) => {
    this.setState({ fileName: e.target.value })
  }

  _setUserSelection = (e) => {
    const { fileName } = this.state

    // find an extension and select only the file name before the extension
    const regexMatch = fileName.match(fileExtensionRegex)

    if (regexMatch) {
      e.target.setSelectionRange(0, fileName.lastIndexOf(regexMatch[2]) - 1)
    } else {
      e.target.select()
    }
  }

  _createFile = (e) => {
    e.preventDefault()

    ipc.showSpecDialog()
  }
}

export default NewSpecModal
