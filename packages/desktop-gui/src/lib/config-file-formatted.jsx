import React from 'react'
import { isUndefined } from 'lodash'

const configFileFormatted = (configFile) => {
  if (configFile === false) {
    return <><code>cypress.config.js</code> file (currently disabled by <code>--config-file false</code>)</>
  }

  if (isUndefined(configFile)) {
    return <><code>cypress.config.js</code> file</>
  }

  if (['cypress.config.ts', 'cypress.config.js'].includes(configFile)) {
    return <><code>{configFile}</code> file</>
  }

  return <>custom config file <code>{configFile}</code></>
}

export {
  configFileFormatted,
}
