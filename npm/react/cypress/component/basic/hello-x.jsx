import React from 'react'

// pass name via props
export class HelloX extends React.Component {
  render() {
    return <p>Hello {this.props.name}!</p>
  }
}

export class HelloState extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      name: 'Spider-man',
    }
  }

  render() {
    return <p>Hello {this.state.name}!</p>
  }
}
