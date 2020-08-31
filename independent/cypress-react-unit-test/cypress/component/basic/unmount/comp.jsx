import React, { Component } from 'react'

export default class Comp extends Component {
  componentDidMount() {
    this.props.onMount()
  }

  componentWillUnmount() {
    this.props.onUnmount()
  }

  render() {
    return <div>Component with mount and unmount calls</div>
  }
}
