import _ from 'lodash'
import { Dialog } from '@reach/dialog'
import { observer, useLocalStore } from 'mobx-react'

import cs from 'classnames'
import React, { useRef } from 'react'
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

const Modal = observer(({ close, state, onSetEditor, onSelectEditor }) => {
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
          chosenEditor={state.chosenEditor}
          editors={state.editors}
          onSelect={onSelectEditor}
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
    chosenEditor: null,
    setIsLoadingEditor (isLoading) {
      this.isLoadingEditor = isLoading
    },
    setIsModalOpen (isOpen) {
      this.isModalOpen = isOpen
    },
    setEditors (editors) {
      this.editors = editors
    },
    setChosenEditor (editor) {
      this.chosenEditor = editor
    },
  }))

  const openFileInEditor = () => {
    state.setIsLoadingEditor(true)

    events.emit('get:user:editor', (result) => {
      state.setIsLoadingEditor(false)

      if (result.preferredEditor) {
        return openFile(result.preferredEditor, fileDetails)
      }

      state.setIsModalOpen(true)
      state.setEditors(result.availableEditors)
    })

    // if it is, server returns the editor
    // - just open in that editor
    // else if it's not set, server looks up and returns available editors

    // user needs to set editor
    // this.isModalOpen = true
  }

  const setEditor = () => {
    // TODO: set the editor and settings, then open file in editor
    state.setIsModalOpen(false)
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
        close={_.partial(state.setIsModalOpen, false)}
      />
    </span>
  )
})

export default ErrorFilePath
