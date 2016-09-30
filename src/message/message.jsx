import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

export default observer(({ state }) => {
  if (!state.messageTitle) return null

  const title = state.messageDescription ? `${state.messageTitle}: ` : state.messageTitle

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
      className={`message-container message-${state.messageStyles.state}`}
      style={state.messageStyles.styles}
    >
      <div className={cs('message', state.messageType)}>
        <span className='title'>{title}</span>
        <span className='description'>{state.messageDescription}</span>
      </div>
      {controls()}
    </div>
  )
})
