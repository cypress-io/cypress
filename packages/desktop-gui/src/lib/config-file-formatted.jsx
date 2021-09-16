import React from 'react'
import { isUndefined } from 'lodash'

const configFileFormatted = (configFile) => {
  if (configFile === false) {
    return <><code>cypress.json</code> file (currently disabled by <code>--config-file false</code>)</>
  }

  if (isUndefined(configFile) || ['cypress.json', 'cypress.config.js'].includes(configFile)) {
    // allow error to happen before the project is open and the config file is resolved
    // by setting up a default to cypress.json
    return <><code>{configFile || 'cypress.json'}</code> file</>
  }

  return <>custom config file <code>{configFile}</code></>
}

export {
  configFileFormatted,
}
