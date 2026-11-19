// example from https://reactjs.org/docs/testing-recipes.html#data-fetching
import React, { useState, useEffect } from 'react'

interface UserData {
  name: string
  age: string
  address: string
}

export default function User (props: { id: string }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // cancel the request, and ignore its response, once the id is no longer current
    const controller = new AbortController()

    setUser(null)
    setError(null)

    fetch(`/${props.id}`, { signal: controller.signal })
    .then((response) => response.json())
    .then((data: UserData) => {
      if (!controller.signal.aborted) {
        setUser(data)
      }
    })
    .catch((err: Error) => {
      if (!controller.signal.aborted) {
        setError(err.message)
      }
    })

    return () => {
      controller.abort()
    }
  }, [props.id])

  if (error) {
    return `failed to load user: ${error}`
  }

  if (!user) {
    return 'loading...'
  }

  return (
    <details>
      <summary>{user.name}</summary>
      <strong>{user.age}</strong> years old
      <br />
      lives in {user.address}
    </details>
  )
}
