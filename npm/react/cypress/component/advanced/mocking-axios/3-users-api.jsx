import React from 'react'
// import wrapped Axios method
import { get } from './axios-api'

export class Users extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
    }
  }

  componentDidMount() {
    get('https://jsonplaceholder.cypress.io/users?_limit=3').then(response => {
      // JSON responses are automatically parsed.
      this.setState({
        users: response.data,
      })
    })
  }

  render() {
    return (
      <div>
        {this.state.users.map(user => (
          <li key={user.id}>
            <strong>{user.id}</strong> - {user.name}
          </li>
        ))}
      </div>
    )
  }
}
