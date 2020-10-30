import React from 'react'
import ChildComponent from './ChildComponent'

const ParentComponent = () => {
  return (
    <div>
    Parent component, child component below
      <br />
      <ChildComponent />
    </div>
  )
}

export default ParentComponent
