import _ from 'lodash'
import { Dialog } from '@reach/dialog'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'

import cs from 'classnames'
import React from 'react'
import VisuallyHidden from '@reach/visually-hidden'
import { EditorPicker } from '@packages/ui-components'

import events from '../lib/events'

const openFile = (where, { absoluteFile: file, line, column }) => {
  events.emit('open:file', {
    where,
    file,
    line,
    column,
  })
}

const validate = (chosenEditor) => {
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

const EditorPickerModal = observer(({ chosenEditor, editors, isOpen, onClose, onSetChosenEditor, onSetEditor }) => {
  const state = useLocalStore((external) => ({
    setOtherPath: action((otherPath) => {
      const otherOption = _.find(external.editors, { isOther: true })

      otherOption.openerId = otherPath
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

const ErrorFilePath = observer(({ fileDetails }) => {
  const state = useLocalStore(() => ({
    editors: [],
    chosenEditor: {},
    isLoadingEditor: false,
    isModalOpen: false,
    setChosenEditor: action((editor) => {
      state.chosenEditor = editor
    }),
    setEditors: action((editors) => {
      state.editors = editors
    }),
    setIsLoadingEditor: action((isLoading) => {
      state.isLoadingEditor = isLoading
    }),
    setIsModalOpen: action((isOpen) => {
      state.isModalOpen = isOpen
    }),
  }))

  const attemptOpenFile = (e) => {
    e.preventDefault()

    if (state.isLoadingEditor) return

    state.setIsLoadingEditor(true)

    // TODO: instead of the back-n-forth, send 'open:file' or similar, and if the
    // user editor isn't set, it should send back the available editors
    events.emit('get:user:editor', (result) => {
      state.setIsLoadingEditor(false)

      if (result.preferredOpener) {
        return openFile(result.preferredOpener, fileDetails)
      }

      state.setEditors(result.availableEditors)
      state.setIsModalOpen(true)
    })
  }

  const setEditor = (editor) => {
    events.emit('set:user:editor', editor)
    state.setIsModalOpen(false)
    state.setChosenEditor({})
    openFile(editor, fileDetails)
  }

  const { relativeFile, line, column } = fileDetails

  return (
    <a className='runnable-err-file-path' onClick={attemptOpenFile} href='#'>
      {relativeFile}:{line}:{column}
      <EditorPickerModal
        chosenEditor={state.chosenEditor}
        editors={state.editors}
        isOpen={state.isModalOpen}
        onSetEditor={setEditor}
        onSetChosenEditor={state.setChosenEditor}
        onClose={_.partial(state.setIsModalOpen, false)}
      />
    </a>
  )
})

export default ErrorFilePath
