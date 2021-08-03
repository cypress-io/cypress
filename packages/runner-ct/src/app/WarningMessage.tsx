import * as React from 'react'
import { Warning } from '../lib/state'
import styles from './WarningMessage.module.scss'

interface WarningMessageProps{
	warning: Warning
	onDismissWarning: () => void
}

export const WarningMessage: React.FC<WarningMessageProps> =
  ({ warning }) => {
    return (
      <pre className={styles.warning}>
        {JSON.stringify(warning.message)}
      </pre>
    )
  }
