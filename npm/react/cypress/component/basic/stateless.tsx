import React from 'react'

// example stateless component from
// https://hackernoon.com/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc
interface HelloWorldProps {
  name: string
  click: (greeting: string) => React.MouseEventHandler<HTMLAnchorElement> | undefined
}

const HelloWorld = ({ name, click }: HelloWorldProps) => {
  return (
    <div>
      <a href="#" onClick={click(`Hi ${name}`)}>
        Say Hi
      </a>
    </div>
  )
}

export default HelloWorld
