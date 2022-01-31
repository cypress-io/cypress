import React from 'react'

const configFileFormatted = (configFile) => {
  if (configFile === false) {
    return (
      <>
        <code>
cypress.config.
          {`{ts | js}`}
        </code>
        {' '}
file (currently disabled by
        {' '}
        <code>--config-file false</code>
)
      </>
    )
  }

  if (['cypress.config.ts', 'cypress.config.js'].includes(configFile)) {
    return (
      <>
        <code>
          {configFile}
        </code>
        {' '}
file
      </>
    )
  }

  return (
    <>
custom config file
      <code>
        {configFile}
      </code>
    </>
  )
}

export {
  configFileFormatted,
}
