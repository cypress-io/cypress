import { createSignal } from 'solid-js'

export function Hello () {
  const [count, setCount] = createSignal(0)

  const doubleCount = () => {
    return count() * 2
  }

  function handleClick () {
    setCount(count() + 1)
  }

  return <div>Hello
    <span data-cy="count">

    count : {count()}
    </span>
    <span data-cy="doubleCount">

    doubleCount: {doubleCount()}
    </span>
    <button onClick={handleClick}>btn</button>
  </div>
}
