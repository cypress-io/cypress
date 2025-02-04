import React, { useState, useEffect } from 'react'

export default function LoadingIndicator ({ isLoading, children }) {
  const [isPastDelay, setIsPastDelay] = useState(false)

  useEffect(() => {
    const _delayTimer = setTimeout(() => {
      console.log('2000ms passed')
      setIsPastDelay(true)
    }, 2000)

    return () => {
      clearTimeout(_delayTimer)
    }
  }, [])

  if (isLoading) {
    if (!isPastDelay) {
      return null
    }

    return <div>loading...</div>
  }

  return children
}
