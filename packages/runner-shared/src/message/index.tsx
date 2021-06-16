import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { forwardRef } from 'react'
import './message.scss'

interface MessageProps {
  state: {
    messageTitle?: string
    messageControls?: unknown
    messageDescription: string
    messageType?: string
    messageStyles: {
      state: string
      styles: React.CSSProperties
      messageType: string
    }
  }
}

export const Message = observer(forwardRef<HTMLDivElement, MessageProps>(({ state }, ref) => {
  if (!state.messageTitle) return null

  const controls = state.messageControls
    ? (
      <div className='message-controls'>
        {state.messageControls as any}
      </div>
    )
    : null

  return (
    <div
      ref={ref}
      className={cs(
        'message-container',
        `message-${state.messageStyles.state}`,
        `message-type-${state.messageType}`,
        { 'message-has-description': !!state.messageDescription },
      )}
      style={state.messageStyles.styles}
    >
      <div className='message'>
        <span className='title'>
          {state.messageTitle}
        </span>
        <span className='description'>
          {state.messageDescription}
        </span>
      </div>
      {controls}
    </div>
  )
}))
