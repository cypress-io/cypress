import React from 'react'

export function Counter () {
  const [count, setCount] = React.useState(0)

  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}
