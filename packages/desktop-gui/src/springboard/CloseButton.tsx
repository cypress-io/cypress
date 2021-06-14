import * as React from 'react'

interface CloseButtonProps {
  onClose?: React.MouseEventHandler<HTMLSpanElement>
}

export const CloseButton: React.FC<CloseButtonProps> = (props) => {
  return (
    <span className="closeButton" role="button" {...props}>
      ❌
    </span>
  )
}
