import * as React from 'react'

export class Button extends React.Component {
  render() {
    return (
      <button {...this.props}>
        {this.props.children}
      </button>
    )
  }
}

export class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0
    }
  }

  render() {
    return (
      <div>
        <div>Count is {this.state.count}</div>
        <Button onClick={() => this.setState({ count: this.state.count + 1 })}>Increment</Button>
      </div>
    )
  }
}