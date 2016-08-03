import React, { Children, cloneElement, Component, PropTypes } from 'react'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'

import PortalPopper from './portal-popper'

@observer
class Tooltip extends Component {
  @observable show = false

  render () {
    const actionProps = this.props.visible == null ? {
      onMouseOver: action('mouse:over', () => this.show = true),
      onMouseOut: action('mouse:out', () => this.show = false),
    } : {}

    return (
      <span>
        {cloneElement(Children.only(this.props.children), {
          ref: 'target',
          ...actionProps,
        })}
        {this._popper()}
      </span>
    )
  }

  _popper () {
    if (this.props.visible !== true && (!this.show || this.props.visible === false)) return null

    return (
      <PortalPopper
        getTargetNode={() => this.refs.target}
        title={this.props.title}
        placement={this.props.placement}
      />
    )
  }
}

Tooltip.propTypes = {
  placement: PropTypes.string,
  title: PropTypes.string.isRequired,
  visible: PropTypes.bool,
}

Tooltip.defaultProps = {
  placement: 'top',
}

export default Tooltip
