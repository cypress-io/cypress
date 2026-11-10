import React from 'react'

// example stateless component from
// https://hackernoon.com/react-stateless-functional-components-nine-wins-you-might-have-overlooked-997b0d933dbc

interface HelloWorldProps {
  name: string
  click?: () => void
}

const HelloWorld = ({ name, click }: HelloWorldProps) => {
  const sayHi = () => {
    console.log('about to alert')
    alert(`Hi ${name}`)
  }

  return (
    <div>
      <a href="#" onClick={sayHi}>
        Say Hi
      </a>
    </div>
  )
}

export default HelloWorld
