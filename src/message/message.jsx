import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

export default observer(({ state }) => {
  if (!state.messageTitle) return null

  const title = state.messageDescription ? `${state.messageTitle}: ` : state.messageTitle

  return (
    <div className='message-container' style={state.messageStyles}>
      <p className={cs('message', state.messageType)}>
        <span className='title'>{title}</span>
        <span className='description'>{state.messageDescription}</span>
      </p>
    </div>
  )
})
