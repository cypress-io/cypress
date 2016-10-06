import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'

export default class Dropdown extends Component {
  constructor (props) {
    super(props)

    this.state = { open: false }
  }

  render () {
    return (
      <div className={cs('dropdown', { open: this.state.open })}>
        <button onClick={() => this.props.onSelect(this.props.chosen)}>
          {this.props.renderItem(this.props.chosen)}
        </button>
        {this._caret()}
        {this._items()}
      </div>
    )

  }

  _caret () {
    if (!this.props.others.length) return null

    return (
      <button className='dropdown-toggle' onClick={this._toggleOpen}>
        <span className='dropdown-caret'></span>
        <span className='sr-only'>Toggle Dropdown</span>
      </button>
    )
  }

  _toggleOpen = () => {
    this.setState({ open: !this.state.open })
  }

  _items () {
    if (!this.props.others.length) return null

    return (
      <ul className='dropdown-menu'>
        {_.map(this.props.others, (item) => (
          <li
            key={item.key}
            tabIndex='0'
            onClick={() => this.props.onSelect(item)}
          >{this.props.renderItem(item)}</li>
        ))}
      </ul>
    )
  }
}
