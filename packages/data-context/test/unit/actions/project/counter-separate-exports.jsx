import React from 'react'

function CounterContainer () {
  const [count, setCount] = React.useState(0)

  return <CounterView count={count} setCount={setCount} />
}

function CounterView ({ count, setCount }) {
  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}

export {
  CounterView,
}

export default CounterContainer
