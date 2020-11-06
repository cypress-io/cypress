import React from 'react'
import useRS from 'radioactive-state'

// click on the counter to increment

export const Counter = () => {
  // create a radioactive state
  const state = useRS({
    count: 0,
  })

  // mutating the state triggers a re-render
  const increment = () => state.count++

  return (
    <div className="count" onClick={increment}>
      {state.count}
    </div>
  )
}
