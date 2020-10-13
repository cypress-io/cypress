import React from 'react'
import './Button.css'

export class Button extends React.Component {
  handleClick() {
    this.props.clickHandler(this.props.name)
  }

  render() {
    const className = [
      'component-button',
      this.props.orange ? 'orange' : '',
      this.props.wide ? 'wide' : '',
    ]

    return (
      <div className={className.join(' ').trim()}>
        <button onClick={this.handleClick.bind(this)}>{this.props.name}</button>
      </div>
    )
  }
}
