import React from 'react'

// pass name via props
export class HelloX extends React.Component<{ name: string }> {
  render () {
    return <p>Hello {this.props.name}!</p>
  }
}

export class HelloState extends React.Component<object, { name: string }> {
  constructor (props: object) {
    super(props)
    this.state = {
      name: 'Spider-man',
    }
  }

  render () {
    return <p>Hello {this.state.name}!</p>
  }
}
