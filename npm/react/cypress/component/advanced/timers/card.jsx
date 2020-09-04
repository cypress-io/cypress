import React, { useEffect } from 'react'

export default function Card (props) {
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      console.log('after timeout') // eslint-disable-line no-console
      props.onSelect(null)
    }, 5000)

    return () => {
      console.log('clearing timeout') // eslint-disable-line no-console
      clearTimeout(timeoutID)
    }
  }, [props.onSelect])

  console.log('inside Card') // eslint-disable-line no-console

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
