import _ from 'lodash'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Tooltip from '@cypress/react-tooltip'

const Highlight = ({ selector, appendTo, styles, showTooltip = true }) => {
  return (
    <div>
      {_.map(styles, (style, i) => {
        // indicates that tooltip should change if one of these props change
        const updateCue = _.values(_.pick(style, 'width', 'height', 'top', 'left', 'transform')).join()

        return (
          <Tooltip
            key={i}
            title={selector}
            visible={showTooltip}
            placement='top-start'
            appendTo={appendTo}
            updateCue={updateCue}
          >
            <div className='highlight' style={style} />
          </Tooltip>
        )
      })}
    </div>
  )
}

function renderHighlight (container, props) {
  render(<Highlight {...props} />, container)
}

export default {
  render: renderHighlight,
  unmount: unmountComponentAtNode,
}
