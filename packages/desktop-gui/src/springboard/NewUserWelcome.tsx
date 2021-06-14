import * as React from 'react'

import { BaseModal } from './BaseModal'
import { CloseButton } from './CloseButton'

interface NewUserWelcomeProps {
  onClose?: React.MouseEventHandler<HTMLElement>
}

export const NewUserWelcome: React.FC<NewUserWelcomeProps> = (props) => {
  const [showHelper, setShowHelper] = React.useState(false)

  return (
    <>
      <div className="welcomeWrapper">
        <CloseButton data-cy="closeWithButton" onClick={props.onClose} />
        <h3 className="title">Welcome to Cypress!</h3>
        <p className="subtitle">
          Cypress allows you to write both e2e (end-to-end) and component tests.
        </p>
        <p className="buttonWrapper">
          <button
            className="underline"
            data-cy="closeWithText"
            onClick={props.onClose}
          >
            No thanks
          </button>
          <button
            className="outlineButton"
            data-cy="openHelper"
            // @click="showHelper = true"
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
