import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { forwardRef } from 'react'
import { State } from '../lib/state'

const ref = forwardRef<HTMLDivElement, { state: State }>((props, ref) => {
  if (!props.state.messageTitle) return null

  function controls () {
    if (!props.state.messageControls) return null

    return (
      <div className='message-controls'>
        {props.state.messageStyles.state}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cs(
        'message-container',
        `message-${props.state.messageStyles.state}`,
        `message-type-${props.state.messageType}`,
        { 'message-has-description': !!props.state.messageDescription },
      )}
      style={props.state.messageStyles.styles}
    >
      <div className='message'>
        <span className='title'>{props.state.messageTitle}</span>
        <span className='description'>{props.state.messageDescription}</span>
      </div>
      {controls()}
    </div>
  )
})

export const Message = observer(ref)
