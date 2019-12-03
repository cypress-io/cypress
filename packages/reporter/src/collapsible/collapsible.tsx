import cs from 'classnames'
import React, { Component, CSSProperties, ReactNode } from 'react'

import { onEnterOrSpace } from '../lib/util'

interface Props {
  isOpen?: boolean
  headerClass?: string
  headerStyle?: CSSProperties
  header?: ReactNode
  contentClass?: string
}

interface State {
  isOpen: boolean
}

class Collapsible extends Component<Props, State> {
  static defaultProps = {
    isOpen: false,
    headerClass: '',
    headerStyle: {},
    contentClass: '',
  }

  constructor (props: Props) {
    super(props)

    this.state = { isOpen: props.isOpen || false }
  }

  componentDidUpdate (prevProps: Props) {
    if (this.props.isOpen != null && this.props.isOpen !== prevProps.isOpen) {
      this.setState({ isOpen: this.props.isOpen })
    }
  }

  render () {
    return (
      <div className={cs('collapsible', { 'is-open': this.state.isOpen })}>
        <div
          aria-expanded={this.state.isOpen}
          className={cs('collapsible-header', this.props.headerClass)}
          onClick={this._toggleOpen}
          onKeyPress={onEnterOrSpace(this._toggleOpen)}
          role='button'
          style={this.props.headerStyle}
          tabIndex={0}
        >
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
    this.setState({ isOpen: !this.state.isOpen })
  }
}

export default Collapsible
