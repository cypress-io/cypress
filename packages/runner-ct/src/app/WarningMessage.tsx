import * as React from 'react'
import { Warning } from '../lib/state'
import styles from './WarningMessage.module.scss'

interface WarningMessageProps{
  warning: Warning
  onDismissWarning: () => void
}

export const WarningMessage: React.FC<WarningMessageProps> =
  ({ warning, onDismissWarning }) => {
    return (
      <div className={styles.warning}>
        <button aria-label="dismiss" className={styles.close} onClick={onDismissWarning}>
          <i className='fas fa-times' />
        </button>
        <h3>Warning</h3>
        {warning.message}
      </div>
    )
  }
