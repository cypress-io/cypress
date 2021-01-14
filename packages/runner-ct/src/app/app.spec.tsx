import React from 'react'
import { render, screen } from '@testing-library/react'
import sinon from 'sinon'
import driver from '@packages/driver'
import State from '../lib/state'

import App, { AppProps } from './app'

function createProps (): AppProps {
  const spec = {
    name: 'specName.ts',
    absolute: 'path/to/absoluteSpec.ts',
    relative: './path/to/relativeSpec.ts',
  }

  return {
    config: {
      projectName: 'name',
      browsers: [],
      integrationFolder: '',
      numTestsKeptInMemory: 0,
      viewportHeight: 1,
      viewportWidth: 1,
    },
    eventManager: {
      on: sinon.stub(),
      start: sinon.stub(),
      stop: sinon.stub(),
      setup: sinon.stub(),
      notifyRunningSpec: sinon.stub(),
      initialize: sinon.stub(),
      reporterBus: {
        emit: sinon.stub(),
        on: sinon.stub(),
      },
    } as any,
    state: new State({ reporterWidth: 2, specs: [spec], spec }),
  }
}

describe('<App/>', () => {
  beforeEach(() => {
    // since driver is mocked, it can be modified with "returns"
    (driver.$ as any).returns({
      outerHeight () {
        return 10
      },
      empty () {
        return 0
      },
      appendTo: sinon.spy(() => ({
        prop: sinon.spy(),
      })),
      contents: sinon.spy(() => ({
        find: sinon.spy(() => ({
          html: sinon.spy(),
        })),
      })),
    })
  })

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
