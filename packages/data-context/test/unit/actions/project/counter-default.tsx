import React from 'react'

export type Count = number

function CounterDefault () {
  const [count, setCount] = React.useState<Count>(0)

  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}

export default CounterDefault
