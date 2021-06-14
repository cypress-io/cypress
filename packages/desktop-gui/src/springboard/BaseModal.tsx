import * as React from 'react'
import { CloseButton } from './CloseButton'

interface BaseModalProps {
  onClose?: React.MouseEventHandler<HTMLDivElement>
}

export const BaseModal: React.FC<BaseModalProps> = (props) => {
  return (
    <div
      className="overlay"
      ref="overlay"
      onClick={props.onClose}
      role="dialog"
    >
      <div className="wrapper">
        <CloseButton />
        <div className="content">{props.children}</div>
      </div>
    </div>
  )
}
