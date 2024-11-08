import React from 'react'
import './Button.css'

export function Button ({ name, orange, wide, clickHandler }) {
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
      <button onClick={handleClick.bind(this)}>{name}</button>
    </div>
  )
}
