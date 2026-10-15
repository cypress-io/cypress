import React from 'react'
import './Button.css'

interface ButtonProps {
  name: string
  orange?: boolean
  wide?: boolean
  clickHandler: (name: string) => void
}

export function Button ({ name, orange, wide, clickHandler }: ButtonProps) {
  const className = [
    'component-button',
    orange ? 'orange' : '',
    wide ? 'wide' : '',
  ]

  function handleClick () {
    clickHandler(name)
  }

  return (
    <div className={className.join(' ').trim()}>
      <button onClick={handleClick}>{name}</button>
    </div>
  )
}
