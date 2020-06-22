import { observer } from 'mobx-react'
import React from 'react'

import events from './events'

import { GetUserEditorResult, Editor, FileDetails, FileOpener as Opener } from '@packages/ui-components'

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

const getUserEditor = (callback: (result: GetUserEditorResult) => any) => {
  events.emit('get:user:editor', callback)
}

const setUserEditor = (editor: Editor) => {
  events.emit('set:user:editor', editor)
}

const FileOpener = observer((props: Props) => {
  const { originalFile, line, column } = props.fileDetails

  return (
    <Opener
      openFile={openFile}
      getUserEditor={getUserEditor}
      setUserEditor={setUserEditor}
      {...props}
    >
      {originalFile}{!!line && `:${line}`}{!!column && `:${column}`}
    </Opener>
  )
})

export default FileOpener
