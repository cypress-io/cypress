import React from 'react'
import { observer } from 'mobx-react'

import errors from '../lib/errors'

const ErrorMessage = observer(({ error }) => {
  let errorMessage

  if (errors.isTimedOut(error)) {
    errorMessage = (
      <p>The request for runs timed out.</p>
    )
  } else if (errors.isNoConnection(error)) {
    errorMessage = (
      <p>There is no internet connection. The runs can be loaded once you connect to a network.</p>
    )
  } else {
    errorMessage = (
      <div>
        <p>An unexpected error occurred:</p>
        <pre className='alert alert-danger'>
          {error.message}
        </pre>
      </div>
    )
  }

  return (
    <div className='runs-list-error'>
      <div className='empty'>
        <h4>
          <i className='fas fa-exclamation-triangle red'></i>{' '}
          Runs could not be loaded
        </h4>
        {errorMessage}
      </div>
    </div>
  )
})

export default ErrorMessage
