import React from 'react'

export class Counter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      count: 0,
    }

    if (window.Cypress) {
      // if this component is mounted from inside Cypress Test Runner
      // then expose the reference to this instance
      // to allow controlling it from tests
      // eslint-disable-next-line no-console
      console.log(
        'set window.counter to this component in window',
        window.location.pathname,
      )

      window.counter = this
    } else {
      console.log('running outside Cypress') // eslint-disable-line no-console
    }
  }

  click = () => {
    this.setState({
      count: this.state.count + 1,
    })
  }

  render () {
    return <p onClick={this.click}>count: {this.state.count}</p>
  }
}
