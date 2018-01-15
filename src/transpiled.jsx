import React from 'react'

export class Transpiled extends React.Component {
  state = {
    count: 0
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
