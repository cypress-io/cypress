import React from 'react'

interface CounterState {
  count: number
}

export class Counter extends React.Component<object, CounterState> {
  constructor (props: object) {
    super(props)
    this.state = {
      count: 0,
    }
  }

  click = () => {
    this.setState((state) => ({
      count: state.count + 1,
    }))
  }

  render () {
    return <p onClick={this.click}>count: {this.state.count}</p>
  }
}
