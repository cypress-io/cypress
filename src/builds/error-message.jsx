import React from 'react'
import { observer } from 'mobx-react'

import errors from '../lib/errors'

const ErrorMessage = observer(({ error }) => {
  let errorMessage
  if (errors.isTimedOut(error)) {
    errorMessage = (
      <p>Getting the builds timed out.</p>
    )
  } else if (errors.isNoConnection(error)) {
    errorMessage = (
      <p>There is no internet connection.</p>
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
    <div id='builds-list-page' className='builds-list-error'>
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
