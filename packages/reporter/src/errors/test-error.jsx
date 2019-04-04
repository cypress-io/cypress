import React from 'react'
import FlashOnClick from '../lib/flash-on-click'

function TestError (props) {
  function _onErrorClick (e) {
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
