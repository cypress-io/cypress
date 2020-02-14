import cs from 'classnames'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'

class Dropdown extends Component {
  static defaultProps = {
    className: '',
    document,
  }

  static propTypes = {
    className: PropTypes.string,
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

    this.props.document.body.addEventListener('click', this.outsideClickHandler)
  }

  componentWillUnmount () {
    this.props.document.body.removeEventListener('click', this.outsideClickHandler)
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
        <button onClick={this._toggleOpen} className={cs('dropdown-chosen', { disabled: this.props.disabled })}>
          {this._buttonContent()}
        </button>
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
      <>
        {this.props.renderItem(this.props.chosen)}{' '}
        {this._caret()}
      </>
    )
  }

  _caret () {
    if (!this.props.others.length || this.props.disabled) return null

    return (
      <span className='dropdown-toggle'>
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
