// example from https://reactjs.org/docs/testing-recipes.html#data-fetching
import React, { useState, useEffect } from 'react'

export default function User(props) {
  const [user, setUser] = useState(null)

  function fetchUserData(id) {
    fetch('/' + id)
      .then(response => response.json())
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
