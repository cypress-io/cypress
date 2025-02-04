import React, { useState, useEffect } from 'react'

export function Users () {
  const [users, setUsers] = useState([])

  const getUsers = async () => {
    const response = await fetch('https://jsonplaceholder.cypress.io/users?_limit=3')
    const list = await response.json()

    setUsers(list)
  }

  useEffect(() => {
    getUsers()
  }, [])

  return (
    <div>
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.id}</strong> - {user.name}
        </li>
      ))}
    </div>
  )
}
