import React from '#host/react'

// Studio and cy.prompt request react as a ^18.3.1 singleton from the `default`
// share scope. Serving the app's own copy gives them the same React that the
// reporter renders with, since the runner bundle reads it from the host modules.
export const federationShared = {
  react: {
    scope: 'default',
    version: '18.3.1',
    lib: () => React,
    shareConfig: {
      singleton: true,
      requiredVersion: '^18.3.1',
    },
  },
}
