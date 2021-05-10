import BootstrapModal from 'react-bootstrap-modal'
import React from 'react'
import Table from 'react-bootstrap/Table'
import './shortcuts-help-modal'
import { observer } from 'mobx-react'

const shortcuts = [
  {
    id: 1,
    action: 'Re-running the tests',
    key: 'r',
  },
  {
    id: 2,
    action: 'Stopping the tests',
    key: 's',
  },
  {
    id: 3,
    action: 'Continue the tests when paused',
    key: 'c',
  },
  {
    id: 4,
    action: 'Go to the next test when paused',
    key: 'n',
  },
  {
    id: 5,
    action: 'Toggle auto-scrolling',
    key: 'a',
  },
]

const ShortcutsHelpModal = observer(({ show, onClose }) => {
  return (
    <BootstrapModal className='shortcut-modal' data-cy='shortcut-modal' show={show} onHide={onClose} backdrop='static'>
      <div className='modal-body os-dialog'>
        <BootstrapModal.Dismiss className='shortcut-modal-close close' data-cy='shortcut-modal-close'>
          <i className='fas fa-times' />
        </BootstrapModal.Dismiss>
        <Table striped bordered hover className='shortcut-modal-table' data-cy='shortcut-modal-table'>
          <thead>
            <tr>
              <th>Action</th>
              <th>Shortcut</th>
            </tr>
          </thead>
          <tbody>
            {
              shortcuts.map((shortcut) => {
                const { id, action, key } = shortcut

                return (
                  <tr key={id}>
                    <td>{action}</td>
                    <td>
                      <strong>
                        {key}
                      </strong>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </Table>
      </div>
    </BootstrapModal>
  )
})

export default ShortcutsHelpModal
