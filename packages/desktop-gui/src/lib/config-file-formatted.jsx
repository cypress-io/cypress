import React from 'react'
import { isUndefined } from 'lodash'

const configFileFormatted = (configFile) => {
  if (configFile === false) {
    return <><code>cypress.json</code> file (currently disabled by <code>--config-file false</code>)</>
  }

  if (isUndefined(configFile) || configFile === 'cypress.json') {
    return <><code>cypress.json</code> file</>
  }

  return <>custom config file <code>{configFile}</code></>
}

export {
  configFileFormatted,
}
