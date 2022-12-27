import React from 'react'
import DebuggerIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/debugger_x16.svg'
import DeleteIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/status-failed_x12.svg'
import events from '../lib/events'

export const DebugDismiss = (props: { matched: number, total: number }) => {
  return (<button className="debug-dismiss" onClick={() => events.emit('debug:dismiss')}>
    <DebuggerIcon />
    <span>{props.matched} / {props.total} tests</span>
    <DeleteIcon className="delete-icon" />
  </button>)
}
