// example from https://reactjs.org/docs/hooks-overview.html
import React, { useState, useEffect } from 'react'

export default function Counter2WithHooks () {
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.title = `You clicked ${count} times`
  }, [count])

  return (
    <div>
      <p>You clicked {count} times</p>
      <button id="increment" onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  )
}
