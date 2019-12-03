import React, { MouseEvent } from 'react'
import FlashOnClick from '../lib/flash-on-click'
import { Events } from '../lib/events'
import TestModel from '../test/test-model'

interface Props {
  events: Events
  model: TestModel
}

function TestError (props: Props) {
  function _onErrorClick (e: MouseEvent) {
    e.stopPropagation()

    props.events.emit('show:error', props.model.id)
  }

  const { displayMessage } = props.model.err

  return (
    <FlashOnClick
      message='Printed output to your console'
      onClick={_onErrorClick}
    >
      <pre className='test-error'>{displayMessage}</pre>
    </FlashOnClick>
  )
}

export default TestError
