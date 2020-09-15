import { observer } from 'mobx-react'
import React, { ReactNode } from 'react'
import { GetUserEditorResult, Editor, FileDetails, FileOpener as Opener } from '@packages/ui-components'

import events from './events'

interface Props {
  fileDetails: FileDetails
  children: ReactNode
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

const FileOpener = observer(({ fileDetails, children, className }: Props) => (
  <Opener
    openFile={openFile}
    getUserEditor={getUserEditor}
    setUserEditor={setUserEditor}
    fileDetails={fileDetails}
    className={className}
  >
    {children}
  </Opener>
))

export default FileOpener
