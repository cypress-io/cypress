import React, { Component } from 'react'

// Class components will be removed in a future release of React 18+. Until then, this example will serve as a class component example
export default class Card extends Component {
  componentDidMount () {
    this._timeoutID = setTimeout(() => {
      this.props.onSelect(null)
    }, 5000)
  }

  componentWillUnmount () {
    clearTimeout(this._timeoutID)
  }

  render () {
    return [1, 2, 3, 4].map((choice) => (
      <button
        key={choice}
        data-testid={choice}
        onClick={() => this.props.onSelect(choice)}
      >
        {choice}
      </button>
    ))
  }
}
