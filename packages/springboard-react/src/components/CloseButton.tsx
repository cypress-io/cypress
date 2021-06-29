import * as React from 'react'
import styles from './styles/CloseButton.module.scss'

interface CloseButtonProps {
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

export const CloseButton: React.FC<CloseButtonProps> = (props) => {
  return (
    <span className={styles.closeButton} role="button" {...props}>
      ❌
    </span>
  )
}
