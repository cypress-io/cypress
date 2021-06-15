import React, { useState } from 'react'
import { BaseModal } from './BaseModal'
import { CloseButton } from './CloseButton'
import styles from './styles/NewUserWelcome.module.scss'

interface NewUserWelcomeProps {
  onClose?: React.MouseEventHandler<any>
}

export const NewUserWelcome: React.FC<NewUserWelcomeProps> = (props) => {
  const { onClose = () => {} } = props
  const [showHelper, setShowHelper] = useState(false)

  return (
    <>
      <div className={styles.welcomeWrapper}>
        <CloseButton data-cy="closeWithButton" onClick={onClose} />
        <h3 className={styles.title}>Welcome to Cypress!</h3>
        <p className={styles.subtitle}>
          Cypress allows you to write both e2e (end-to-end) and component tests.
        </p>
        <p className={styles.buttonWrapper}>
          <button
            className={styles.underline}
            data-cy="closeWithText"
            onClick={onClose}
          >
            No thanks
          </button>
          <button
            className={styles.outlineButton}
            data-cy="openHelper"
            onClick={() => setShowHelper(true)}
          >
            {`Help me choose >`}
          </button>
        </p>
      </div>
      {showHelper && (
        <BaseModal onClose={() => setShowHelper(false)}>
          <p>Some content here</p>
        </BaseModal>
      )}
    </>
  )
}
