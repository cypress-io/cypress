import cs from 'classnames'
import React, { MouseEvent } from 'react'
import FlashOnClick from '../lib/flash-on-click'
import { Events } from '../lib/events'
import AttemptModel from '../attempts/attempt-model'

interface Props {
  events: Events
  model: AttemptModel
  isTestError: boolean,
  displayMessage: string
}

function TestError (props: Props) {
  const { model, events, isTestError, displayMessage } = props

  function _onErrorClick (e: MouseEvent) {
    e.stopPropagation()
    events.emit('show:error', model.testId, model.id)
  }

  return (
    <FlashOnClick
      message='Printed output to your console'
      onClick={_onErrorClick}
    >
      <pre className={cs('attempt-error', { 'test-error': isTestError })}>{displayMessage}</pre>
    </FlashOnClick>
  )
}

export default TestError
