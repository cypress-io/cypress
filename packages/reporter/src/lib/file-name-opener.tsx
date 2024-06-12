import { observer } from 'mobx-react'
import React from 'react'
import { FileDetails } from '@packages/types'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import TextIcon from '@packages/frontend-shared/src/assets/icons/document-text_x16.svg'
import OpenFileInIDE from './open-file-in-ide'

interface Props {
  fileDetails: FileDetails
  className?: string
  hasIcon?: boolean
}

/**
 * Renders a link-style element that presents a tooltip on hover
 * and opens the file in an external editor when selected.
 */
const FileNameOpener = observer((props: Props) => {
  const { displayFile, originalFile, line, column } = props.fileDetails

  return (
    <Tooltip title={'Open in IDE'} wrapperClassName={props.className} className='cy-tooltip'>
      <span>
        <OpenFileInIDE fileDetails={props.fileDetails} >
          <a href="#" onClick={(e) => e.preventDefault()}>
            {props.hasIcon && (
              <TextIcon />
            )}
            {displayFile || originalFile}{!!line && `:${line}`}{!!column && `:${column}`}
          </a>
        </OpenFileInIDE>
      </span>
    </Tooltip>
  )
})

export default FileNameOpener
