import cs from 'classnames'
import React, { Component, CSSProperties, MouseEvent, ReactNode, RefObject } from 'react'

import { onEnterOrSpace } from '../lib/util'

interface Props {
  isOpen?: boolean
  headerClass?: string
  headerStyle?: CSSProperties
  header?: ReactNode
  headerExtras?: ReactNode
  containerRef?: RefObject<HTMLDivElement>
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
      <div className={cs('collapsible', { 'is-open': this.state.isOpen })} ref={this.props.containerRef}>
        <div className={cs('collapsible-header-wrapper', this.props.headerClass)}>
          <div
            aria-expanded={this.state.isOpen}
            className='collapsible-header'
            onClick={this._onClick}
            onKeyPress={onEnterOrSpace(this._onKeyPress)}
            role='button'
            tabIndex={0}
          >
            <div
              className='collapsible-header-inner'
              style={this.props.headerStyle}
              tabIndex={-1}
            >
              <i className='collapsible-indicator fa-fw fas' />
              <span className='collapsible-header-text'>
                {this.props.header}
              </span>
            </div>
          </div>
          {this.props.headerExtras}
        </div>
        <div className={cs('collapsible-content', this.props.contentClass)}>
          {this.state.isOpen && this.props.children}
        </div>
      </div>
    )
  }

  _toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen })
  }

  _onClick = (e: MouseEvent) => {
    e.stopPropagation()
    this._toggleOpen()
  }

  _onKeyPress = () => {
    this._toggleOpen()
  }
}

export default Collapsible
