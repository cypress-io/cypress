import _ from 'lodash'
import { action, asReference, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, PropTypes } from 'react'
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
        <span>{this.props.title}</span>
        <div ref='arrow' className='tooltip-arrow' style={this._getArrowStyle()} />
      </Portal>
    )
  }

  componentDidMount () {
    this.popper = new this.props.Popper(this.props.getTargetNode(), this.refs.popper.domNode, {
      content: this.props.title,
      placement: this.props.placement,
      modifiersIgnored: ['applyStyle'],
      arrowElement: this.refs.arrow,
    })

    this.popper.onUpdate(action('popper:updated', (data) => {
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
    const left = _.isNumber(this.arrowProps.left) ? Math.round(this.arrowProps.left) : null
    const top = _.isNumber(this.arrowProps.top) ? Math.round(this.arrowProps.top) : null

    return {
      left,
      top,
    }
  }

  componentWillUnmount () {
    this.popper && this.popper.destroy()
  }
}

PortalPopper.propTypes = {
  placement: PropTypes.string.isRequired,
  getTargetNode: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
}

PortalPopper.defaultProps = {
  Popper,
}

export default PortalPopper
