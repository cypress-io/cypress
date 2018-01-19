import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Children, cloneElement, Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

@observer
class FlashOnClick extends Component {
  static propTypes = {
    message: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    shouldShowMessage: PropTypes.func,
  }

  static defaultProps = {
    shouldShowMessage: () => true,
  }

  @observable _show = false

  render () {
    const child = Children.only(this.props.children)

    return (
      <Tooltip placement='top' title={this.props.message} visible={this._show}>
        {cloneElement(child, { onClick: this._onClick })}
      </Tooltip>
    )
  }

  @action _onClick = (e) => {
    this.props.onClick(e)
    if (!this.props.shouldShowMessage()) return

    this._show = true
    setTimeout(action('hide:console:message', () => {
      this._show = false
    }), 1500)
  }
}

export default FlashOnClick
