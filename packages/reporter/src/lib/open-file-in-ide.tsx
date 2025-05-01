import { observer } from 'mobx-react'
import React from 'react'
import type { FileDetails } from '@packages/types'
import events from './events'

interface Props {
  fileDetails: FileDetails
  className?: string
  children?: React.ReactNode
}

// Catches click events that bubble from children and emits open file events to
// be handled by the app.
const OpenFileInIDE: React.FC<Props> = observer((props) => {
  return (
    <span className={props.className} onClick={() => events.emit('open:file:unified', props.fileDetails)}>
      {props.children}
    </span>
  )
})

OpenFileInIDE.displayName = 'OpenFileInIDE'
export default OpenFileInIDE
