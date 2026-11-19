import React, { useEffect } from 'react'

interface CardProps {
  onSelect: (choice: number | null) => void
}

export default function Card ({ onSelect }: CardProps) {
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      console.log('after timeout')
      onSelect(null)
    }, 5000)

    return () => {
      console.log('clearing timeout')
      clearTimeout(timeoutID)
    }
  }, [onSelect])

  console.log('inside Card')

  return [1, 2, 3, 4].map((choice) => (
    <button
      key={choice}
      data-testid={choice}
      onClick={() => onSelect(choice)}
    >
      {choice}
    </button>
  ))
}
