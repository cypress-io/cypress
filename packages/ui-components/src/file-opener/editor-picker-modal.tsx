import _ from 'lodash'
import { Dialog } from '@reach/dialog'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import cs from 'classnames'
import React from 'react'
import VisuallyHidden from '@reach/visually-hidden'

import EditorPicker from './editor-picker'
import { Editor } from './file-model'

interface Props {
  chosenEditor: Editor
  editors: Editor[]
  isOpen: boolean
  onClose: (() => void)
  onSetChosenEditor: ((editor: Editor) => void)
  onSetEditor: ((editor: Editor) => void)
}

const validate = (chosenEditor: Editor) => {
  let isValid = !!chosenEditor && !!chosenEditor.id
  let validationMessage = 'Please select a preference'

  if (isValid && chosenEditor.isOther && !chosenEditor.openerId) {
    isValid = false
    validationMessage = 'Please enter the path for the "Other" editor'
  }

  return {
    isValid,
    validationMessage,
  }
}

const EditorPickerModal = observer(({ chosenEditor, editors, isOpen, onClose, onSetChosenEditor, onSetEditor }: Props) => {
  const state = useLocalStore((external) => ({
    setOtherPath: action((otherPath: string) => {
      const otherOption = _.find(external.editors, { isOther: true })

      if (otherOption) {
        otherOption.openerId = otherPath
      }
    }),
  }), { editors })

  const setEditor = () => {
    const { isValid } = validate(chosenEditor)

    if (!isValid) return

    onSetEditor(chosenEditor)
  }

  if (!editors.length) return null

  const { isValid, validationMessage } = validate(chosenEditor)

  return (
    <Dialog
      className='editor-picker-modal'
      aria-label="Explanation of choosing an editor"
      isOpen={isOpen}
      onDismiss={onClose}
    >
      <div className='content'>
        <h1>File Opener Preference</h1>
        <p>Please select your preference for opening files on your system.</p>
        <EditorPicker
          chosen={chosenEditor}
          editors={editors}
          onSelect={onSetChosenEditor}
          onUpdateOtherPath={state.setOtherPath}
        />
        <p>We will use your selected preference to open files in the future. You can change your preference in the <b>Settings</b> tab of the Cypress Test Runner.</p>
      </div>
      <div className='controls'>
        <Tooltip title={validationMessage} visible={isValid ? false : undefined} className='cy-tooltip'>
          <button className={cs('submit', { 'is-disabled': !isValid })} onClick={setEditor}>Set preference and open file</button>
        </Tooltip>
        <button className='cancel' onClick={onClose}>Cancel</button>
      </div>
      <button className='close-button' onClick={onClose}>
        <VisuallyHidden>Close</VisuallyHidden>
        <span aria-hidden>
          <i className='fas fa-times' />
        </span>
      </button>
    </Dialog>
  )
})

export default EditorPickerModal
