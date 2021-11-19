import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import type { FileDetails } from '@packages/types'
import events from './events'

interface Props {
  fileDetails: FileDetails
  className?: string
  hasIcon?: boolean
}

const OpenFileInIDE: React.FC<Props> = observer((props) => {
  return (
    <Tooltip title={'Open in IDE'} className='cy-tooltip'>
      <span onClick={() => events.emit('open:file', props.fileDetails)}>
        {props.children}
      </span>
    </Tooltip>
  )
})

export default OpenFileInIDE
