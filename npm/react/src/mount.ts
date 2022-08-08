import React from 'react'
import ReactDOM from 'react-dom'
import major from 'semver/functions/major'
import {
  makeMountFn,
  makeUnmountFn,
  lastMountedReactDom,
} from './createMount'
import type {
  MountOptions,
  InternalMountOptions,
  InternalUnmountOptionsReact,
} from './types'

export function mount (jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string) {
  if (major(React.version) >= 18) {
    const message = '[cypress/react]: You are using `cypress/react`, which is designed for React <= 17. Consider changing to `cypress/react18`, which is designed for React 18.'

    console.error(message)
    Cypress.log({ name: 'warning', message })
  }

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
  const internalOptions: InternalUnmountOptionsReact = {
    unmount: (el) => {
      return (lastMountedReactDom || ReactDOM).unmountComponentAtNode(el)
    },
  }

  return makeUnmountFn(options, internalOptions)
}
