import _ from 'lodash'
import { Dialog } from '@reach/dialog'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'

import cs from 'classnames'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'
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
  let validationMessage = 'Please select an editor'

  if (isValid && chosenEditor.isOther && !chosenEditor.openerId) {
    isValid = false
    validationMessage = 'Please enter the path to your editor'
  }

  return {
    isValid,
    validationMessage,
  }
}

const EditorPickerModal = observer(({ editors, isOpen, onClose, onSetEditor }) => {
  const state = useLocalStore((external) => ({
    chosenEditor: {},
    shouldShowValidation: false,
    setChosenEditor: action((editor) => {
      state.setShouldShowValidation(false)
      state.chosenEditor = editor
    }),
    setOtherPath: action((otherPath) => {
      const otherOption = _.find(external.editors, { isOther: true })

      otherOption.openerId = otherPath
    }),
    setShouldShowValidation: action((shouldShow) => {
      state.shouldShowValidation = shouldShow
    }),
  }), { editors })

  const { isValid, validationMessage } = validate(state.chosenEditor)

  const setEditor = () => {
    const editor = state.chosenEditor
    const { isValid } = validate(editor)

    if (!isValid) {
      state.setShouldShowValidation(true)

      return
    }

    onSetEditor(editor)
  }

  if (!editors.length) return null

  return (
    <Dialog
      className='editor-picker-modal'
      aria-label="Explanation of choosing an editor"
      isOpen={isOpen}
      onDismiss={onClose}
    >
      <div className='content'>
        <h1>Select Editor Preference</h1>
        <p>Please select your editor from the editors we found on your system. </p>
        <p>We will use your selected editor to open files in the future. You can change your editor preference in the <b>Settings</b> tab of the Cypress Test Runner.</p>
        <EditorPicker
          chosen={state.chosenEditor}
          editors={editors}
          onSelect={state.setChosenEditor}
          onUpdateOtherPath={state.setOtherPath}
        />
      </div>
      {state.shouldShowValidation && !isValid && (
        <p className='validation-error'>
          <i className='fas fa-exclamation-triangle' />
          {validationMessage}
        </p>
      )}
      <div className='controls'>
        <button className='submit' onClick={setEditor}>Set editor and open file</button>
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
    isLoadingEditor: false,
    isModalOpen: false,
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
    openFile(editor, fileDetails)
  }

  const { relativeFile, line, column } = fileDetails

  return (
    <a className='runnable-err-file-path' onClick={attemptOpenFile} href='#'>
      {relativeFile}:{line}:{column}
      <EditorPickerModal
        editors={state.editors}
        isOpen={state.isModalOpen}
        onSetEditor={setEditor}
        onClose={_.partial(state.setIsModalOpen, false)}
      />
    </a>
  )
})

export default ErrorFilePath
