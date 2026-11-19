import React from '#host/react'

// The Cloud-delivered Studio and cy.prompt bundles are served to every Cypress
// version in the field, so keep this share contract fixed. Serving the app's own
// React keeps them on the copy the reporter renders with.
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
