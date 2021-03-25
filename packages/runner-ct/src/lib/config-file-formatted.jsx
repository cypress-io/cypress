import React from 'react'
import { isUndefined } from 'lodash'

const configFileFormatted = (configFile) => {
  if (configFile === false) {
    return (
      <>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */ }
        <code>cypress.json</code> file (currently disabled by <code>--config-file false</code>)
      </>
    )
  }

  if (isUndefined(configFile) || configFile === 'cypress.json') {
    return (
      <>
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */ }
        <code>cypress.json</code> file
      </>
    )
  }

  return (
    <>
      {/* eslint-disable-next-line react/jsx-one-expression-per-line */ }
      custom config file <code>{configFile}</code>
    </>
  )
}

export {
  configFileFormatted,
}
