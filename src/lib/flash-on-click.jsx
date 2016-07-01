import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Children, cloneElement, Component } from 'react'
import Tooltip from '../lib/tooltip'

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

  @action _onClick = () => {
    this.props.onClick()
    this._show = true
    setTimeout(action('hide:console:message', () => {
      this._show = false
    }), 600)
  }
}

export default FlashOnClick
