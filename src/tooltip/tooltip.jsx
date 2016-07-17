import React, { Component, PropTypes } from 'react'
import { action, asReference, observable } from 'mobx'
import { observer } from 'mobx-react'
import Popper from 'popper.js'

import Portal from '../lib/portal'

const initialArrowProps = {
  left: 0,
  top: 0,
}

const initialPopperProps = {
  left: 0,
  position: 'absolute',
  top: 0,
}

@observer
class PortalPopper extends Component {
  @observable arrowProps = asReference(initialArrowProps)
  @observable popperProps = asReference(initialPopperProps)

  render () {
    return (
      <Portal
        ref='popper'
        className={`tooltip tooltip-${this.props.placement}`}
        style={this._getPopperStyle()}
      >
        {this.props.title}
        <div ref='arrow' className='tooltip-arrow' style={this._getArrowStyle()} />
      </Portal>
    )
  }

  componentDidMount () {
    this.popper = new Popper(this.props.targetNode, this.refs.popper.domNode, {
      content: this.props.title,
      placement: this.props.placement,
      modifiersIgnored: ['applyStyle'],
      arrowElement: this.refs.arrow,
    }).onUpdate(action('popper:updated', (data) => {
      if (data.offsets.arrow) this.arrowProps = data.offsets.arrow
      if (data.offsets.popper) this.popperProps = data.offsets.popper
    }))

    this.popper.update()
  }

  _getPopperStyle () {
    const left = Math.round(this.popperProps.left)
    const top = Math.round(this.popperProps.top)
    const transform = `translate3d(${left}px, ${top}px, 0)`

    return {
      position: this.popperProps.position,
      transform,
      WebkitTransform: transform,
    }
  }

  _getArrowStyle () {
    const left = Math.round(this.arrowProps.left)
    const top = Math.round(this.arrowProps.top)
    const transform = `translate3d(${left}px, ${top}px, 0)`

    return {
      transform,
      WebkitTransform: transform,
    }
  }

  componentWillUnmount () {
    this.popper && this.popper.destroy()
  }
}

PortalPopper.propTypes = {
  placement: PropTypes.string.isRequired,
  targetNode: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
}

@observer
class Tooltip extends Component {
  @observable show = false

  render () {
    const actionProps = this.props.visible == null ? {
      onMouseOver: action('mouse:over', () => this.show = true),
      onMouseOut: action('mouse:out', () => this.show = false),
    } : {}

    return (
      <div ref='target' {...actionProps}>
        {this.props.children}
        {this._popper()}
      </div>
    )
  }

  _popper () {
    if (this.props.visible !== true && (!this.show || this.props.visible === false)) return null

    return <PortalPopper
      targetNode={this.refs.target}
      title={this.props.title}
      placement={this.props.placement}
    />
  }

  @action _show (shouldShow) {
    this.show = shouldShow
  }
}

Tooltip.propTypes = {
  placement: PropTypes.string,
  title: PropTypes.string.isRequired,
  visible: PropTypes.boolean,
}

Tooltip.defaultProps = {
  placement: 'top',
}

export default Tooltip
