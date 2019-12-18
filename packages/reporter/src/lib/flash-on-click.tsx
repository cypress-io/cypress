import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React, { Children, cloneElement, Component, MouseEvent, ReactElement, ReactNode } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

interface Props {
  message: string
  onClick: ((e: MouseEvent) => void)
  shouldShowMessage?: (() => boolean)
}

@observer
class FlashOnClick extends Component<Props> {
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
    const child = Children.only<ReactNode>(this.props.children)

    return (
      <Tooltip placement='top' title={this.props.message} visible={this._show}>
        {cloneElement(child as ReactElement, { onClick: this._onClick })}
      </Tooltip>
    )
  }

  @action _onClick = (e: MouseEvent) => {
    const { onClick, shouldShowMessage } = this.props

    onClick(e)
    if (shouldShowMessage && !shouldShowMessage()) return

    this._show = true
    setTimeout(action('hide:console:message', () => {
      this._show = false
    }), 1500)
  }
}

export default FlashOnClick
