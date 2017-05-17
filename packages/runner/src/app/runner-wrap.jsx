import React from 'react'

const RunnerWrap = (props) => (
  <div {...props} className={`runner ${props.className}`}>
    {props.children}
  </div>
)

export default RunnerWrap
