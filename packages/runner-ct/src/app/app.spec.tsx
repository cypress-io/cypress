import React from 'react'
import { render, screen } from '@testing-library/react'
import App, { AppProps } from './app'
import State from '../lib/state'

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
      absolute: 'path/to/absoluteSpec.ts',
      relative: './path/to/relativeSpec.ts',
    }] }),
  }
}

describe('<App/>', () => {
  it('renders a search field', () => {
    const props = createProps()

    render(<App {...props}/>)

    screen.getByPlaceholderText('Select tests to run...')
  })

  it('renders the spec', () => {
    const props = createProps()

    render(<App {...props}/>)

    screen.getByText('specName.ts')
  })

  it('renders a reporter', () => {
    const props = createProps()

    render(<App {...props}/>)

    screen.getByTestId('reporter')
  })
})
