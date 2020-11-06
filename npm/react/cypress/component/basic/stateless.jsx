import React from 'react'

// example stateless component from
// https://hackernoon.com/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc
const HelloWorld = ({ name, click }) => {
  return (
    <div>
      <a href="#" onClick={click(`Hi ${name}`)}>
        Say Hi
      </a>
    </div>
  )
}

export default HelloWorld
