import React from 'react'

export class Counter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      count: 0
    }
  }

  click () {
    this.setState({
      count: this.state.count + 1
    })
  }

  render () {
    return <p onClick={this.click.bind(this)}>count: {this.state.count}</p>
  }
}
