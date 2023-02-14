import React from 'react'

const Errors = ({ throwOnMount = false }) => {
  const one = (msg) => {
    two(msg)
  }

  const two = (msg) => {
    three(msg)
  }

  const three = (msg) => {
    throw new Error(msg)
  }

  if (throwOnMount) {
    one('mount error')
  }

  return (
    <div>
      <button
        onClick={() => one('sync error')}
        id="trigger-sync-error"
      >
        Sync Error
      </button>
      <button
        onClick={() => setTimeout(() => one('async error'), 100)}
        id="trigger-async-error"
      >
        Async Error
      </button>
      <button
        onClick={() => (async () => one('promise rejection'))()}
        id="trigger-unhandled-rejection"
      >
        Rejection
      </button>
    </div>
  )
}

export default Errors
