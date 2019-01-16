import { action } from 'mobx'
import React, { Component } from 'react'

class Resizer extends Component {
  render () {
    return (
      <div
        ref='resizer'
        className='runner-resizer'
        style={this.props.style}
        onMouseDown={this._startResize}
      />
    )
  }

  componentDidMount () {
    this._isDragging = false

    document.addEventListener('mousemove', this._resize)
    document.addEventListener('mouseup', this._endResize)
  }

  @action _startResize = (e) => {
    e.preventDefault()

    this._isDragging = true
    this.props.onResizeStart()
  }

  @action _resize = (e) => {
    const minWidth = 0
    const maxWidth = this.props.state.windowWidth

    if (this._isDragging) {
      e.preventDefault()

      let width = e.clientX

      if (width < minWidth) width = minWidth

      if (width > maxWidth) width = maxWidth

      this.props.onResize(width)
    }
  }

  @action _endResize = () => {
    if (this._isDragging) {
      this.props.onResizeEnd()
    }

    this._isDragging = false
  }

  componentWillUnmount () {
    document.removeEventListener('mousemove', this._resize)
    document.removeEventListener('mouseup', this._endResize)
  }
}

export default Resizer
