import _ from 'lodash'
import { action } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import React, { MouseEvent } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import EditorPickerModal, { Editor } from './editor-picker-modal'
import { FileDetails } from './file-model'
import events from '../lib/events'

interface GetUserEditorResult {
  preferredOpener?: Editor
  availableEditors?: Editor[]
}

interface Props {
  fileDetails: FileDetails,
  className?: string
}

const openFile = (where: Editor, { absoluteFile: file, line, column }: FileDetails) => {
  events.emit('open:file', {
    where,
    file,
    line,
    column,
  })
}

const FileOpener = observer(({ fileDetails, className }: Props) => {
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
    events.emit('get:user:editor', (result: GetUserEditorResult) => {
      state.setIsLoadingEditor(false)

      if (result.preferredOpener) {
        return openFile(result.preferredOpener, fileDetails)
      }

      state.setEditors(result.availableEditors || [])
      state.setIsModalOpen(true)
    })
  }

  const setEditor = (editor: Editor) => {
    events.emit('set:user:editor', editor)
    state.setIsModalOpen(false)
    state.setChosenEditor({} as Editor)
    openFile(editor, fileDetails)
  }

  const { originalFile, line, column } = fileDetails

  return (
    <Tooltip title={'Open in IDE'} wrapperClassName={className} className='cy-tooltip'>
      <a onClick={attemptOpenFile} href='#'>
        {originalFile}{!!line && `:${line}`}{!!column && `:${column}`}
        <EditorPickerModal
          chosenEditor={state.chosenEditor}
          editors={state.editors}
          isOpen={state.isModalOpen}
          onSetEditor={setEditor}
          onSetChosenEditor={state.setChosenEditor}
          onClose={_.partial(state.setIsModalOpen, false)}
        />
      </a>
    </Tooltip>
  )
})

export default FileOpener
