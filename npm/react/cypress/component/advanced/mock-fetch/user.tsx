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
    // ignore responses for an id that is no longer current
    let ignore = false

    fetch(`/${props.id}`)
    .then((response) => response.json())
    .then((data: UserData) => {
      if (!ignore) {
        setUser(data)
      }
    })
    .catch((err: Error) => {
      if (!ignore) {
        setError(err.message)
      }
    })

    return () => {
      ignore = true
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
