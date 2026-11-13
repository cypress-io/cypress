import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMClient from 'react-dom/client'
import * as MobX from 'mobx'
import { HOST_MODULES_GLOBAL } from '@packages/types/src/host-modules'
import type { HostModuleSpecifier } from '@packages/types/src/host-modules'

// Default imports of react and react-dom are their CommonJS `module.exports`,
// which is the shape webpack's interop expects from an external.
const hostModules: Record<HostModuleSpecifier, unknown> = {
  'react': React,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  'mobx': MobX,
}

export function publishHostModules () {
  Object.assign(window, { [HOST_MODULES_GLOBAL]: hostModules })
}
