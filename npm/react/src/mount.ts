import { getContainerEl } from '@cypress/mount-utils'
import React from 'react'
import ReactDOM from 'react-dom'
import {
  makeMountFn,
  makeUnmountFn,
} from './createMount'
import type {
  MountOptions,
  InternalMountOptions,
} from './types'

let lastReactDom: typeof ReactDOM

const cleanup = () => {
  if (lastReactDom) {
    const root = getContainerEl()

    lastReactDom.unmountComponentAtNode(root)

    return true
  }

  return false
}

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement, reactDomToUse: typeof ReactDOM) => {
      lastReactDom = (reactDomToUse || ReactDOM)

      return lastReactDom.render(reactComponent, el)
    },
    unmount,
    cleanup,
  }

  return makeMountFn('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

export function unmount (options = { log: true }) {
  return makeUnmountFn(options)
}
