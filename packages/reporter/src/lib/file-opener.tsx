import { observer } from 'mobx-react'
import React, { ReactNode } from 'react'
import type { FileDetails } from '@packages/types'
import OpenFileInIDE from './open-file-in-ide'

interface Props {
  fileDetails: FileDetails
  children: ReactNode
  className?: string
}

const FileOpener = observer(({ fileDetails, children, className }: Props) => (
  <OpenFileInIDE
    fileDetails={fileDetails}
    className={className}
  >
    <a href="#" onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  </OpenFileInIDE>
))

export default FileOpener
