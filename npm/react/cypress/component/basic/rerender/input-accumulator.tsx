import React, { useEffect, useState } from 'react'

export const InputAccumulator = ({ input }: { input: string }) => {
  const [store, setStore] = useState<string[]>([])

  useEffect(() => {
    setStore((prev) => [...prev, input])
  }, [input])

  return (<ul>
    {store.map((v) => <li key={v}>{v}</li>)}
  </ul>)
}
