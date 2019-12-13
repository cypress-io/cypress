import _ from 'lodash'
import { Dialog } from '@reach/dialog'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'

import cs from 'classnames'
import React, { useRef } from 'react'
import Tooltip from '@cypress/react-tooltip'
import VisuallyHidden from '@reach/visually-hidden'
import { EditorPicker } from '@packages/ui-components'

import events from '../lib/events'

const openFile = (where, { absoluteFile: file, line, column }, editor) => {
  events.emit('open:file', {
    where,
    file,
    line,
    column,
    editor,
  })
}

const Modal = observer(({ close, state, onSetEditor, onSelectEditor, onUpdateOtherPath }) => {
  const cancelRef = useRef()

  return (
    <Dialog
      aria-label="Explanation of choosing an editor"
      initialFocusRef={cancelRef}
      isOpen={state.isModalOpen}
      onDismiss={close}
    >
      <div className='content'>
        <p>It looks like this is your first time opening a file in your editor. Please select from one of the editors we found on your system.</p>
        <p>The editor you select will be used automatically from now on to open files. You can change your selection in the Settings tab of the Cypress app.</p>
        <EditorPicker
          chosen={state.chosenEditor}
          editors={state.editors}
          onSelect={onSelectEditor}
          onUpdateOtherPath={onUpdateOtherPath}
        />
      </div>
      <div className='controls'>
        <button className='submit' onClick={onSetEditor}>Set Editor</button>
        <button className='cancel' onClick={close} ref={cancelRef}>Cancel</button>
      </div>
      <button className='close-button' onClick={close}>
        <VisuallyHidden>Close</VisuallyHidden>
        <span aria-hidden>
          <i className='fa fa-remove' />
        </span>
      </button>
    </Dialog>
  )
})

const ErrorFilePath = observer(({ fileDetails }) => {
  const state = useLocalStore(() => ({
    isLoadingEditor: false,
    isModalOpen: false,
    editors: [],
    chosenEditor: {},
    setIsLoadingEditor: action((isLoading) => {
      state.isLoadingEditor = isLoading
    }),
    setIsModalOpen: action((isOpen) => {
      state.isModalOpen = isOpen
    }),
    setEditors: action((editors) => {
      state.editors = editors
    }),
    setChosenEditor: action((editor) => {
      state.chosenEditor = editor
    }),
    setOtherPath: action((otherPath) => {
      const otherOption = _.find(state.editors, { isOther: true })

      otherOption.openerId = otherPath
    }),
  }))

  const openFileInEditor = () => {
    state.setIsLoadingEditor(true)

    events.emit('get:user:editor', (result) => {
      state.setIsLoadingEditor(false)

      if (result.preferredEditor) {
        return openFile('editor', fileDetails, result.preferredEditor)
      }

      state.setEditors(result.availableEditors)
      state.setIsModalOpen(true)
    })
  }

  const setEditor = () => {
    // TODO: validate editor is chosen
    const editor = state.chosenEditor

    // QUESTION: add error handling for this?
    events.emit('set:user:editor', editor)
    state.setIsModalOpen(false)
    openFile('editor', fileDetails, editor)
  }

  const openFileOnComputer = () => {
    openFile('computer', fileDetails)
  }

  const { relativeFile, line, column } = fileDetails

  const tooltipContent = (<>
    <button onClick={openFileOnComputer}>
      <span>Open on Computer</span>
    </button>
    <button
      className={cs({ 'is-loading': state.isLoadingEditor })}
      disabled={state.isLoadingEditor}
      onClick={openFileInEditor}
    >
      <span className='text'>Open in Editor</span>
      <span className='loader'>
        <i className='fa fa-spinner fa-spin fa-pulse'></i>
      </span>
    </button>
  </>)

  return (
    <span className='runnable-err-file-path'>
      <Tooltip title={tooltipContent} className='err-file-options tooltip'>
        <span>{relativeFile}:{line}:{column}</span>
      </Tooltip>
      <Modal
        state={state}
        onSelectEditor={state.setChosenEditor}
        onSetEditor={setEditor}
        onUpdateOtherPath={state.setOtherPath}
        close={_.partial(state.setIsModalOpen, false)}
      />
    </span>
  )
})

export default ErrorFilePath
