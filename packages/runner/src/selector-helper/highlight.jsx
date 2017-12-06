import _ from 'lodash'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Tooltip from '@cypress/react-tooltip'

const Highlight = ({ selector, appendTo, boundary, onClick, style }) => {
  // indicates that tooltip should change if one of these props change
  const updateCue = _.values(_.pick(style, 'width', 'height', 'top', 'left', 'transform')).join()

  return (
    <Tooltip
      title={selector}
      className='__cypress-selector-helper-tooltip'
      visible={true}
      placement='top-start'
      appendTo={appendTo}
      boundary={boundary}
      updateCue={updateCue}
    >
      <div className='__cypress-selector-helper-highlight' onClick={onClick} style={style} />
    </Tooltip>
  )
}

function renderHighlight (container, props) {
  render(<Highlight {...props} />, container)
}

export default {
  render: renderHighlight,
  unmount: unmountComponentAtNode,
}
