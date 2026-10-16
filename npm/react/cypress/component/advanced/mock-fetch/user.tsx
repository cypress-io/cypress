// example from https://reactjs.org/docs/testing-recipes.html#data-fetching
import React, { useState, useEffect } from 'react'

interface UserData {
  name: string
  age: string
  address: string
}

export default function User (props: { id: string }) {
  const [user, setUser] = useState<UserData | null>(null)

  function fetchUserData (id: string) {
    fetch(`/${id}`)
    .then((response) => response.json())
    .then(setUser)
  }

  useEffect(() => {
    fetchUserData(props.id)
  }, [props.id])

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
