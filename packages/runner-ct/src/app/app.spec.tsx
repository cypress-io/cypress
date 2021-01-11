import React from 'react'
import { render, screen } from '@testing-library/react'
import App, { AppProps } from './app'
import State from '../lib/state'
import { relative } from 'path'

function createProps (): AppProps {
  return {
    config: {
      projectName: '',
      browsers: [],
      integrationFolder: '',
      numTestsKeptInMemory: 0,
      viewportHeight: 1,
      viewportWidth: 1,
    },
    eventManager: {
      on: () => {},
      start: () => {},
      stop: () => {},
      notifyRunningSpec: () => {},
    } as any,
    runMode: 'single',
    state: new State({ reporterWidth: 2, specs: [{
      name: 'specName.ts',
      absolute: 'path/to/spec.ts',
      relative: './path/to/spec.ts',
    }] }),
  }
}

describe('<App/>', () => {
  it('renders a search field', () => {
    const props = createProps()

    render(<App {...props}/>)

    screen.getByPlaceholderText('Select tests to run...')
  })
})
