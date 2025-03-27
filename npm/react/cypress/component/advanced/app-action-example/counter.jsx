import React, { useState } from 'react'

export function Counter () {
  const [count, setCount] = useState(0)

  if (window.Cypress) {
    // if this component is mounted from inside Cypress Test Runner
    // then expose the reference to this instance
    // to allow controlling it from tests
    console.log(
      'set window.counter to this component in window',
      window.location.pathname,
    )

    window.counter = {
      count,
      setCount,
    }
  } else {
    console.log('running outside Cypress')
  }

  function click () {
    setCount(count + 1)
  }

  return <p onClick={click}>count: {count}</p>
}
