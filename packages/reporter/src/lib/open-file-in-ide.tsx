import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import type { FileDetails } from '@packages/types'
import events from './events'

import TextIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/document-text_x16.svg'

interface Props {
  fileDetails: FileDetails
  className?: string
  hasIcon?: boolean
}

const OpenFileInIDE = observer((props: Props) => {
  return (
    <Tooltip title={'Open in IDE'} className='cy-tooltip'>
      <span onClick={() => events.emit('open:file', props.fileDetails)}>
        <TextIcon />
      </span>
    </Tooltip>
  )
})

export default OpenFileInIDE
