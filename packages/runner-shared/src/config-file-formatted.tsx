import React from 'react'

const configFileFormatted = (configFile) => {
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
