import React from 'react'
import useRS from 'radioactive-state'

// deep mutation also triggers re-render !
const Counters = () => {
  const state = useRS({
    counts: [0],
    sum: 0,
  })

  const increment = i => {
    state.counts[i]++
    state.sum++
  }

  const addCounter = () => state.counts.push(0)

  return (
    <>
      <button onClick={addCounter}> Add Counter </button>
      <div className="counts">
        {state.counts.map((count, i) => (
          <div className="count" onClick={() => increment(i)} key={i}>
            {count}
          </div>
        ))}
      </div>
      <div className="count sum">{state.sum}</div>
    </>
  )
}

export default Counters
