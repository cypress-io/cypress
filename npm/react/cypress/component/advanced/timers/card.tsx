import React, { useEffect } from 'react'

interface CardProps {
  onSelect: (choice: number | null) => void
}

export default function Card (props: CardProps) {
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      console.log('after timeout')
      props.onSelect(null)
    }, 5000)

    return () => {
      console.log('clearing timeout')
      clearTimeout(timeoutID)
    }
  }, [props.onSelect])

  console.log('inside Card')

  return [1, 2, 3, 4].map((choice) => (
    <button
      key={choice}
      data-testid={choice}
      onClick={() => props.onSelect(choice)}
    >
      {choice}
    </button>
  ))
}
