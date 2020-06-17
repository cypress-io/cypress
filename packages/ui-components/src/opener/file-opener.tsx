import _ from 'lodash'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React, { MouseEvent, ReactNode } from 'react'

import EditorPickerModal from './editor-picker-modal'
import { GetUserEditorResult, Editor, FileDetails } from './file-model'

interface Props {
  children: ReactNode
  fileDetails: FileDetails
  openFile: (where: Editor, absoluteFile: FileDetails) => any
  getUserEditor: (callback: (result: GetUserEditorResult) => void) => any
  setUserEditor: (editor: Editor) => any
  className?: string
}

const FileOpener = observer(({ children, fileDetails, openFile, getUserEditor, setUserEditor, className }: Props) => {
  const state = useLocalStore(() => ({
    editors: [] as Editor[],
    chosenEditor: {} as Editor,
    isLoadingEditor: false,
    isModalOpen: false,
    setChosenEditor: action((editor: Editor) => {
      state.chosenEditor = editor
    }),
    setEditors: action((editors: Editor[]) => {
      state.editors = editors
    }),
    setIsLoadingEditor: action((isLoading: boolean) => {
      state.isLoadingEditor = isLoading
    }),
    setIsModalOpen: action((isOpen: boolean) => {
      state.isModalOpen = isOpen
    }),
  }))

  const attemptOpenFile = (e: MouseEvent) => {
    e.preventDefault()

    if (state.isLoadingEditor) return

    state.setIsLoadingEditor(true)

    // TODO: instead of the back-n-forth, send 'open:file' or similar, and if the
    // user editor isn't set, it should send back the available editors
    getUserEditor((result: GetUserEditorResult) => {
      state.setIsLoadingEditor(false)

      if (result.preferredOpener) {
        return openFile(result.preferredOpener, fileDetails)
      }

      state.setEditors(result.availableEditors || [])
      state.setIsModalOpen(true)
    })
  }

  const setEditor = (editor: Editor) => {
    setUserEditor(editor)
    state.setIsModalOpen(false)
    state.setChosenEditor({} as Editor)
    openFile(editor, fileDetails)
  }

  return (
    <a className={className} onClick={attemptOpenFile} href='#'>
      {children}
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

export default FileOpener
