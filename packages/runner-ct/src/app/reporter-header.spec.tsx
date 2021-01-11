import React from 'react'
import { render, screen } from '@testing-library/react'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
import { ReporterHeader } from './reporter-header'

function createProps ():ReporterHeaderProps {
  return {
    appState: {

    } as any,
    statsStore: {
      numPassed: 1,
      numFailed: 2,
      numPending: 3,
    } as any,
  }
}

describe('<ReporterHeader />', () => {
  it('renders stats', () => {
    const props = createProps()

    render(<ReporterHeader {...props}/>)

    screen.getByText('Passed:')
    screen.getByText('Failed:')
    screen.getByText('Pending:')
  })
})
