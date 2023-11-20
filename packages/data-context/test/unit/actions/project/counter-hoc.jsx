import React from 'react'

function Counter () {
  const [count, setCount] = React.useState(0)

  return <p onClick={() => setCount(count + 1)}>count: {count}</p>
}

const connect = (component) => component

export default connect(Counter)
