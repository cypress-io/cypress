import React from 'react'
import DebuggerIcon from '@packages/frontend-shared/src/assets/icons/debugger_x16.svg'
import DeleteIcon from '@packages/frontend-shared/src/assets/icons/status-failed_x12.svg'
import events from '../lib/events'

export const DebugDismiss = (props: { matched: number, total: number }) => {
  return (
    <button type='button' className="debug-dismiss" onClick={() => events.emit('testFilter:cloudDebug:dismiss')}>
      <DebuggerIcon />
      <span>{props.matched} / {props.total} {props.total > 1 ? 'tests' : 'test'}</span>
      <DeleteIcon className="delete-icon" />
    </button>
  )
}
