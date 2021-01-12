import React from 'react'
import { render, screen } from '@testing-library/react'
import { SpecsList, SpecsListProps } from './specs-list'

const baseVals: Cypress.Cypress['spec'] = {
  absolute: '/',
  relative: '/',
  name: '',
}

const files = [
  { ...baseVals, name: 'forOfStatement.js' },
  { ...baseVals, name: 'foo/y/bar.js' },
]

function createProps ():SpecsListProps {
  return {
    state: {
      filteredSpecs: files,
    } as any,
    config: {} as any,
  }
}

describe('<SpecsList />', () => {
  it('creates the list', () => {
    const props = createProps()

    render(<SpecsList {...props}/>)

    screen.getByText('forOfStatement.js')
    screen.getByText('bar.js')
  })
})
