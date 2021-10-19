import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import { FileDetails } from '@packages/ui-components'

import FileOpener from './file-opener'

import TextIcon from '-!react-svg-loader!../lib/img/document-text_x16.svg'

interface Props {
  fileDetails: FileDetails
  className?: string
}

const FileNameOpener = observer((props: Props) => {
  const { originalFile, line, column } = props.fileDetails

  return (
    <Tooltip title={'Open in IDE'} wrapperClassName={props.className} className='cy-tooltip'>
      <span>
        <FileOpener fileDetails={props.fileDetails}>
          <TextIcon />
          {originalFile}{!!line && `:${line}`}{!!column && `:${column}`}
        </FileOpener>
      </span>
    </Tooltip>
  )
})

export default FileNameOpener
