import * as React from 'react'

import { mount } from './mount'

type MountHookResult<T> = {
  readonly current: T | null | undefined
  readonly error: Error | null
}

type ResultContainer<T> = {
  result: MountHookResult<T>
  addResolver: (resolver: () => void) => void
  setValue: (val: T) => void
  setError: (err: Error) => void
}

// mounting hooks inside a test component mostly copied from
// https://github.com/testing-library/react-hooks-testing-library/blob/master/src/pure.js
function resultContainer<T> (): ResultContainer<T> {
  let value: T | undefined | null = null
  let error: Error | null = null
  const resolvers: any[] = []

  const result = {
    get current () {
      if (error) {
        throw error
      }

      return value
    },
    get error () {
      return error
    },
  }

  const updateResult = (val: T | undefined, err: Error | null = null) => {
    value = val
    error = err
    resolvers.splice(0, resolvers.length).forEach((resolve) => resolve())
  }

  return {
    result,
    addResolver: (resolver: (() => void)) => {
      resolvers.push(resolver)
    },
    setValue: (val: T) => updateResult(val),
    setError: (err: Error) => updateResult(undefined, err),
  }
}

type TestHookProps = {
  callback: () => void
  onError: (e: Error) => void
  children: (...args: any[]) => any
}

function TestHook ({ callback, onError, children }: TestHookProps) {
  try {
    children(callback())
  } catch (err) {
    if (err.then) {
      throw err
    } else {
      onError(err)
    }
  }

  return null
}

/**
 * Mounts a React hook function in a test component for testing.
 *
 */
export const mountHook = <T>(hookFn: (...args: any[]) => T) => {
  const { result, setValue, setError } = resultContainer<T>()

  const componentTest: React.ReactElement = React.createElement(TestHook, {
    callback: hookFn,
    onError: setError,
    children: setValue,
  })

  return mount(componentTest).then(() => {
    cy.wrap(result)

    return result
  })
}
