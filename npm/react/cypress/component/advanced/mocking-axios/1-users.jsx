import React, { useState, useEffect } from 'react'
// import the entire axios module
// later we can use axios.get to make requests
import axios from 'axios'

export function Users () {
  const [users, setUsers] = useState([])

  const getUsers = async () => {
    const response = await axios.get('https://jsonplaceholder.cypress.io/users?_limit=3')

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
