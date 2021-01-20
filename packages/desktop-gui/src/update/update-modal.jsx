import { observer } from 'mobx-react'
import React from 'react'
import Modal from 'react-bootstrap4-modal'

import updateStore from '../update/update-store'

import { LoadingReleaseNotes, ReleaseNotes } from './release-notes'
import { UpdateInstructions } from './update-instructions'

const Contents = observer(({ onShowInstructions }) => {
  switch (updateStore.state) {
    case updateStore.LOADING_RELEASE_NOTES:
      return <LoadingReleaseNotes />
    case updateStore.SHOW_RELEASE_NOTES:
      return <ReleaseNotes onShowInstructions={onShowInstructions} />
    case updateStore.SHOW_INSTRUCTIONS:
      return <UpdateInstructions />
    default:
      return null
  }
})

const UpdateModal = observer(({ show, onClose }) => {
  const showInstructions = () => {
    updateStore.setState(updateStore.SHOW_INSTRUCTIONS)
  }

  return (
    <Modal visible={show} onClickBackdrop={onClose}>
      <div className='update-modal modal-body os-dialog'>
        <button onClick={onClose} className='close'>
          <i className='fas fa-times' />
        </button>
        <Contents onShowInstructions={showInstructions} />
      </div>
    </Modal>
  )
})

export default UpdateModal
