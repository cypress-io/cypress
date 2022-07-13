import cs from 'classnames'
import React from 'react'
import type { SessionRenderProps } from './command-model'

const SessionPill = ({ status }: SessionRenderProps) => {
  return (
    <span className={cs(['command-session-status', status])}>
      {status}
    </span>
  )
}

export default SessionPill
