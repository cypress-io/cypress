import React from 'react'

interface SquareProps {
  value: string
  onClick: React.MouseEventHandler<HTMLButtonElement>
}

export default function Square ({ value, onClick }: SquareProps) {
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  )
}
