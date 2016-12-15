import React from 'react'
import { observer } from 'mobx-react'

import errors from '../lib/errors'

const ErrorMessage = observer(({ error }) => {
  let errorMessage
  if (errors.isTimedOut(error)) {
    errorMessage = (
      <p>Getting the builds timed out.</p>
    )
  } else {
    errorMessage = (
      <div>
        <p>An unexpected error occurred:</p>
        <div className='full-alert alert alert-danger error'>
          {error.stack}
        </div>
      </div>
    )
  }

  return (
    <div id='builds-list-page'>
      <div className="empty">
        <h4>
          Builds could not be loaded
        </h4>
        {errorMessage}
      </div>
    </div>
  )
})

export default ErrorMessage
