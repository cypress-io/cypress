import React, { useEffect, useState } from 'react'

export const InputAccumulator = ({ input }) => {
  const [store, setStore] = useState([])

  useEffect(() => {
    setStore((prev) => [...prev, input])
  }, [input])

  return (
    <ul>
      {store.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  )
}
