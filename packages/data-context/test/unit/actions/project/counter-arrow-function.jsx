import React from 'react'

export const Counter = () => {
  const [count, setCount] = React.useState(0)

  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}
