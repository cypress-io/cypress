import cs from 'classnames'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'

class Dropdown extends Component {
  static defaultProps = {
    className: '',
  }

  static propTypes = {
    className: PropTypes.string,
    icon: PropTypes.string,
    chosen: PropTypes.object.isRequired,
    others: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSelect: PropTypes.func.isRequired,
    renderItem: PropTypes.func.isRequired,
    // property for unique value on each item that can be used as its key
    keyProperty: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
  }

  state = { open: false }

  componentDidMount () {
    this.outsideClickHandler = (e) => {
      if (!findDOMNode(this).contains(e.target)) {
        this.setState({ open: false })
      }
    }

    document.body.addEventListener('click', this.outsideClickHandler)
  }

  componentWillUnmount () {
    document.body.removeEventListener('click', this.outsideClickHandler)
  }

  render () {
    return (
      <li className={cs('dropdown', this.props.className, { open: this.state.open })}>
        {this._button()}
        {this._items()}
      </li>
    )
  }

  _button () {
    if (this.props.others.length) {
      return (
        <a onClick={this._toggleOpen} className={this.props.disabled ? 'disabled' : ''}>
          {this._buttonContent()}
        </a>
      )
    }

    return (
      <span>
        {this._buttonContent()}
      </span>
    )

  }

  _buttonContent () {
    return (
      <span>
        {this.props.renderItem(this.props.chosen)}{' '}
        {this._caret()}
      </span>
    )
  }

  _caret () {
    if (!this.props.others.length || this.props.disabled) return null

    return (
      <span>
        <span className='dropdown-caret'></span>
        <span className='sr-only'>Toggle Dropdown</span>
      </span>
    )
  }

  _toggleOpen = () => {
    this.setState({ open: !this.state.open })
  }

  _items () {
    if (!this.props.others.length || this.props.disabled) return null

    return (
      <ul className='dropdown-menu'>
        {_.map(this.props.others, (item) => (
          <li
            key={item[this.props.keyProperty]}
            tabIndex='0'
            onClick={() => this._onSelect(item)}
          >{this.props.renderItem(item)}</li>
        ))}
      </ul>
    )
  }

  _onSelect (item) {
    this.setState({ open: false })
    this.props.onSelect(item)
  }
}

export default Dropdown
