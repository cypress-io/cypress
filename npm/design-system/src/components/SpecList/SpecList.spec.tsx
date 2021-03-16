import { mount } from '@cypress/react'
import React from 'react'
import { SpecList } from './SpecList'

describe('SpecList', () => {
  it('renders', () => {
    const Wrapper: React.FC = () => {
      let specs: Cypress.Cypress['spec'][] = [
        {
          relative: 'foo/bar/foo.spec.js',
          absolute: 'Users/code/foo/bar/foo.spec.js',
          name: 'foo/bar/foo.spec.js',
        },
        {
          relative: 'bar/foo.spec.tsx',
          absolute: 'bar/foo.spec.tsx',
          name: 'bar/foo.spec.tsx',
        },
        {
          relative: 'merp/foo.spec.ts',
          absolute: 'merp/foo.spec.ts',
          name: 'merp/foo.spec.ts',
        },
      ]

      return (
        <SpecList specs={specs} />
      )
    }

    mount(<Wrapper />)
  })
})
