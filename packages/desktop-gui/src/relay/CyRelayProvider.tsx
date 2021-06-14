import React, { Suspense } from 'react'
import { RelayEnvironmentProvider } from 'react-relay/hooks'
import { relayEnvironment } from './CyRelayEnvironment'

export function CyRelayProvider ({ children }) {
  return (
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <Suspense fallback="">
        {children}
      </Suspense>
    </RelayEnvironmentProvider>
  )
}
