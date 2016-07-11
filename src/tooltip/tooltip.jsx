import React, { PropTypes } from 'react'
import RcTooltip from 'rc-tooltip'

import { CONTAINER_ID } from '../lib/constants'

// compensates for issues with default alignment
// TODO: move this to CSS
const align = (placement) => {
  switch (placement) {
    case 'left':
      return { offset: [5, 0] }
    case 'top':
      return { offset: [0, 5] }
    default:
      return {}
  }
}

const Tooltip = (props) => (
  <RcTooltip
    overlay={props.title}
    placement={props.placement}
    align={align(props.placement)}
    getTooltipContainer={() => document.getElementById(CONTAINER_ID)}
    destroyTooltipOnHide={true}
    {...props}
  >
    {props.children}
  </RcTooltip>
)

Tooltip.propTypes = {
  title: PropTypes.string.isRequired,
  placement: PropTypes.string,
}

export default Tooltip
