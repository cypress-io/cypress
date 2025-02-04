import React, { useState, useEffect } from 'react'
// import wrapped Axios method
import axiosApi from './axios-api.jsx'

export function Users () {
  const [users, setUsers] = useState([])

  const getUsers = async () => {
    console.log({ axiosApi })
    const response = await axiosApi.get('https://jsonplaceholder.cypress.io/users?_limit=3')

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
