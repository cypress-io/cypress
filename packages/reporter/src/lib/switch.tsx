import { action, makeObservable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

interface Props {
  value: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  'data-cy'?: string
  onUpdate: (e: MouseEvent) => void
}

@observer
class Switch extends Component<Props> {
  @action _onClick = (e: MouseEvent) => {
    const { onUpdate } = this.props

    onUpdate(e)
  }

  constructor (props: Props) {
    super(props)
    makeObservable(this)
  }

  render () {
    const { 'data-cy': dataCy, size = 'lg', value } = this.props

    return (
      <button
        data-cy={dataCy}
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
