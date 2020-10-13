import React, { Component } from 'react'

export default class Card extends Component {
  componentDidMount() {
    this._timeoutID = setTimeout(() => {
      this.props.onSelect(null)
    }, 5000)
  }

  componentWillUnmount() {
    clearTimeout(this._timeoutID)
  }

  render() {
    return [1, 2, 3, 4].map(choice => (
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
