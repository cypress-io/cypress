import cs from 'classnames'
import { observer } from 'mobx-react'
import React, { forwardRef } from 'react'

export default observer(forwardRef(({ state }, ref) => {
  if (!state.messageTitle) return null

  function controls () {
    if (!state.messageControls) return null

    return (
      <div className='message-controls'>
        {state.messageControls}
      </div>
    )
  }

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
        <span className='title'>{state.messageTitle}</span>
        <span className='description'>{state.messageDescription}</span>
      </div>
      {controls()}
    </div>
  )
}))
