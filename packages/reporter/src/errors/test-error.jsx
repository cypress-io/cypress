import React from 'react'
import Markdown from 'markdown-it'
import FlashOnClick from '../lib/flash-on-click'

const md = new Markdown('zero')

md.enable(['backticks', 'escape'])

const formattedMessage = (message) => {
  return message ? md.renderInline(message) : ''
}

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
      <pre className='test-error' dangerouslySetInnerHTML={{ __html: formattedMessage(displayMessage) }}></pre>
    </FlashOnClick>
  )
}

export default TestError
