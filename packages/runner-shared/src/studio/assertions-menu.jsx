import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

const AssertionsMenu = ({ style }) => {
  return (
    <div className='assertions-menu' style={style}>
      <div className='title'>Add Assertion</div>
    </div>
  )
}

const renderAssertionsMenu = (container, props) => {
  render(<AssertionsMenu {...props} />, container)
}

export const studioAssertionsMenu = {
  render: renderAssertionsMenu,
  unmount: unmountComponentAtNode,
}
