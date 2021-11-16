import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

interface Props {
  value: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  name: string
  onUpdate: (e: MouseEvent) => void
}

@observer
class Switch extends Component<Props> {
  @action _onClick = (e: MouseEvent) => {
    const { onUpdate } = this.props

    onUpdate(e)
  }

  render () {
    const { name, size = 'lg', value } = this.props

    return (
      <button
        id={name}
        className={`switch switch-${size}`}
        role="switch"
        aria-checked={value}
        onClick={this._onClick}
      >
        <span className="indicator" />
      </button>
    )
  }
}

export default Switch
