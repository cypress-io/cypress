import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Skeleton from 'react-loading-skeleton'

export default class Post extends Component {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'large']),
  }

  static defaultProps = {
    size: 'small',
  }

  getStyle() {
    const { size } = this.props
    const baseStyle = {
      padding: 8,
      width: '20em',
    }
    return Object.assign(baseStyle, {
      fontSize: size === 'small' ? 16 : 25,
      lineHeight: size === 'small' ? 'normal' : 2,
    })
  }

  render() {
    return (
      <div style={this.getStyle()}>
        <h1>{this.props.title || <Skeleton />}</h1>
        <p>{this.props.children || <Skeleton count={5} />}</p>
      </div>
    )
  }
}
