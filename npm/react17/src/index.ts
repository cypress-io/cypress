import React from 'react'
import ReactDOM from 'react-dom'
import {
  makeMountFn,
  makeUnmountFn,
  lastMountedReactDom,
} from '@cypress/react'
import type {
  MountOptions,
  InternalMountOptions,
  InternalUnmountOptionsReact17,
} from '@cypress/react'

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  const internalOptions: InternalMountOptions = {
    reactDom: ReactDOM,
    render: (reactComponent: ReturnType<typeof React.createElement>, el: HTMLElement, reactDomToUse: typeof ReactDOM) => {
      return (reactDomToUse || ReactDOM).render(reactComponent, el)
    },
    unmount,
  }

  return makeMountFn('mount', jsx, { ReactDom: ReactDOM, ...options }, rerenderKey, internalOptions)
}

export function unmount (options = { log: true }) {
  const internalOptions: InternalUnmountOptionsReact17 = {
    unmount: (el) => {
      return (lastMountedReactDom || ReactDOM).unmountComponentAtNode(el)
    },
  }

  return makeUnmountFn(options, internalOptions)
}
