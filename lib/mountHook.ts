import * as React from 'react'
import { mount } from './mount'

// mounting hooks inside a test component mostly copied from
// https://github.com/testing-library/react-hooks-testing-library/blob/master/src/pure.js
function resultContainer<T>() {
  let value: T | undefined | null = null
  let error: Error | null = null
  const resolvers: any[] = []

  const result = {
    get current() {
      if (error) {
        throw error
      }
      return value
    },
    get error() {
      return error
    },
  }

  const updateResult = (val: T | undefined, err: Error | null = null) => {
    value = val
    error = err
    resolvers.splice(0, resolvers.length).forEach(resolve => resolve())
  }

  return {
    result,
    addResolver: (resolver: any) => {
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

function TestHook({ callback, onError, children }: TestHookProps) {
  try {
    children(callback())
  } catch (err) {
    if (err.then) {
      throw err
    } else {
      onError(err)
    }
  }

  // TODO decide what the test hook component should show
  // maybe nothing, or maybe useful information about the hook?
  // maybe its current properties?
  // return <div>TestHook</div>
  return null
}

/**
 * Mounts a React hook function in a test component for testing.
 *
 * @see https://github.com/bahmutov/cypress-react-unit-test#advanced-examples
 */
export const mountHook = (hookFn: (...args: any[]) => any) => {
  const { result, setValue, setError } = resultContainer()

  return mount(
    React.createElement(TestHook, {
      callback: hookFn,
      onError: setError,
      children: setValue,
    }),
  ).then(() => {
    cy.wrap(result)
  })
}
