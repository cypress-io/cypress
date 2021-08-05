import * as React from 'react'
import { MarkdownRenderer } from '@packages/ui-components'
import { Warning } from '../lib/state'
import styles from './WarningMessage.module.scss'
import { eventManager } from '@packages/runner-shared'

interface WarningMessageProps{
  warning: Warning
  onDismissWarning: () => void
}

function clickHandler (e) {
  if (e.target.href) {
    e.preventDefault()

    return eventManager.externalOpen(e.target.href)
  }
}

export const WarningMessage: React.FC<WarningMessageProps> =
  ({ warning, onDismissWarning }) => {
    return (
      <div className={styles.warning}>
        <button aria-label="dismiss" className={styles.close} onClick={onDismissWarning}>
          <i className='fas fa-times' />
        </button>
        <h2 className={styles.title}>Warning</h2>
        <MarkdownRenderer markdown={warning.message} clickHandler={clickHandler} />
      </div>
    )
  }
