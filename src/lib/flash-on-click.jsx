import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Children, cloneElement, Component, PropTypes } from 'react'
import Tooltip from '@cypress/react-tooltip'

@observer
class FlashOnClick extends Component {
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
    this._show = true
    setTimeout(action('hide:console:message', () => {
      this._show = false
    }), 600)
  }
}

FlashOnClick.propTypes = {
  message: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default FlashOnClick
