// example from https://reactjs.org/docs/testing-recipes.html#events
import React, { useState } from 'react'

export default function Toggle(props) {
  const [state, setState] = useState(false)
  return (
    <button
      onClick={() => {
        setState(previousState => !previousState)
        props.onChange(!state)
      }}
      data-testid="toggle"
    >
      {state === true ? 'Turn off' : 'Turn on'}
    </button>
  )
}
