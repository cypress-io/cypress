import { observer } from 'mobx-react'
import React from 'react'
import Modal from 'react-bootstrap4-modal'
import BodyEnd from '../app/body-end'

import updateStore from '../update/update-store'

import { LoadingReleaseNotes, ReleaseNotes } from './release-notes'
import { UpdateInstructions } from './update-instructions'

const Contents = observer(({ onShowInstructions, onModalClose }) => {
  switch (updateStore.state) {
    case updateStore.LOADING_RELEASE_NOTES:
      return <LoadingReleaseNotes onModalClose={onModalClose} />
    case updateStore.SHOW_RELEASE_NOTES:
      return <ReleaseNotes onShowInstructions={onShowInstructions} onModalClose={onModalClose} />
    case updateStore.SHOW_INSTRUCTIONS:
      return <UpdateInstructions onModalClose={onModalClose} />
    default:
      return null
  }
})

const UpdateModal = observer(({ show, onClose }) => {
  if (!show) {
    return null
  }

  const showInstructions = () => {
    updateStore.setState(updateStore.SHOW_INSTRUCTIONS)
  }

  // Teleport to end of body, otherwise it will pick up the footer styles
  return (
    <BodyEnd>
      <Modal className="update-modal os-dialog" dialogClassName="modal-dialog-centered" visible={show} onClickBackdrop={onClose}>
        <Contents onModalClose={onClose} onShowInstructions={showInstructions} />
      </Modal>
    </BodyEnd>
  )
})

export default UpdateModal
