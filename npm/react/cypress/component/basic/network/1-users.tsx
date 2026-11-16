import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: number
  name: string
}

export function Users () {
  const [users, setUsers] = useState<User[]>([])

  const getUsers = async () => {
    const response = await axios.get<User[]>('https://jsonplaceholder.cypress.io/users?_limit=3')

    setUsers(response.data)
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
