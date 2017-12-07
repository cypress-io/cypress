import _ from 'lodash'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Tooltip from '@cypress/react-tooltip'

const Highlight = ({ selector, appendTo, boundary, style }) => {
  // indicates that tooltip should change if one of these props change
  const updateCue = _.values(_.pick(style, 'width', 'height', 'top', 'left', 'transform')).join()

  return (
    <Tooltip
      title={selector}
      visible={true}
      placement='top-start'
      appendTo={appendTo}
      boundary={boundary}
      updateCue={updateCue}
    >
      <div className='highlight' style={style} />
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
