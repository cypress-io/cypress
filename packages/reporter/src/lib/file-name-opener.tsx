import { observer } from 'mobx-react'
import React from 'react'
import { FileDetails } from '@packages/types'

import FileOpener from './file-opener'

import TextIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/document-text_x16.svg'

interface Props {
  fileDetails: FileDetails
  className?: string
  hasIcon?: boolean
}

const FileNameOpener = observer((props: Props) => {
  const { displayFile, originalFile, line, column } = props.fileDetails

  return (
    <FileOpener fileDetails={props.fileDetails} className={props.className}>
      {props.hasIcon && (
        <TextIcon />
      )}
      {displayFile || originalFile}{!!line && `:${line}`}{!!column && `:${column}`}
    </FileOpener>
  )
})

export default FileNameOpener
