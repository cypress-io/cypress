import cs from 'classnames'
import React, { Component } from 'react'

class Collapsible extends Component {
  static defaultProps = {
    isOpen: false,
    headerClass: '',
    headerStyle: {},
    contentClass: '',
  }

  constructor (props) {
    super(props)

    this.state = { isOpen: props.isOpen }
  }

  componentDidUpdate (prevProps) {
    if (this.props.isOpen != null && this.props.isOpen !== prevProps.isOpen) {
      this.setState({ isOpen: this.props.isOpen })
    }
  }

  render () {
    return (
      <div className={cs('collapsible', { 'is-open': this.state.isOpen })}>
        <div className={cs('collapsible-header', this.props.headerClass)} style={this.props.headerStyle} onClick={this._toggleOpen}>
          <i className='collapsible-indicator fa-fw fa'></i>
          {this.props.header}
          <i className='collapsible-more fa fa-ellipsis-h'></i>
        </div>
        <div className={cs('collapsible-content', this.props.contentClass)}>
          {this.props.children}
        </div>
      </div>
    )
  }

  _toggleOpen = () => {
    const isOpen = !this.state.isOpen

    this.setState({ isOpen })

    if (this.props.onToggle) {
      this.props.onToggle(isOpen)
    }
  }
}

export default Collapsible
