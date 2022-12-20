import React from 'react'

export function CounterContainer () {
  const [count, setCount] = React.useState(0)

  return <CounterView count={count} setCount={setCount} />
}

export function CounterView ({ count, setCount }) {
  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}
