import React from 'react'
import { mount } from '@cypress/react'
import { SpecList } from '../../../src/SpecList'
import { SpecFile, SpecFolderOrSpecFile } from '../../../src/SpecList/make-spec-hierarchy'
import { SpecFileItem } from '../../../src/SpecList/SpecFileItem'

const baseSpec: Cypress.Cypress['spec'] = {
  absolute: '/aaa',
  relative: 'aaa.js',
  name: 'aaa/aaa.js',
}

const spec: SpecFile = {
  ...baseSpec,
  name: 'foo-bar.js',
  shortName: 'foo-bar.js',
  type: 'file',
}

const files: SpecFolderOrSpecFile[] = [
  {
    ...baseSpec,
    name: 'index.spec.js',
    absolute: 'index.spec.js',
    shortName: 'index.spec.js',
    type: 'file',
  },
  {
    shortName: 'components',
    type: 'folder',
    specs: [
      {
        shortName: '.keep',
        type: 'folder',
        specs: []
      },
      {
        shortName: 'tmp',
        type: 'folder',
        specs: []
      },
      {
        shortName: 'shared',
        type: 'folder',
        specs: [
          {
            ...baseSpec,
            absolute: 'component/shared/bar.js',
            shortName: 'bar.js',
            name: 'comoponent/shared/bar.js',
            type: 'file',
          },
          {
            ...baseSpec,
            shortName: 'runner.js',
            absolute: 'component/shared/runner.js',
            name: 'comoponent/shared/runner.js',
            type: 'file',
          },
          {
            ...baseSpec,
            shortName: 'spec-list.js',
            absolute: 'component/shared/spec-list.js',
            name: 'comoponent/shared/spec-list.js',
            type: 'file',
          },
          {
            shortName: 'utils',
            type: 'folder',
            specs: [
              {
                ...baseSpec,
                absolute: 'component/shared/utils/transform.js',
                shortName: 'transform.js',
                name: 'component/shared/utils/transform.js',
                type: 'file',
              }
            ]
          },
        ],
      },
    ],
  },
]

describe('SpecList', () => {
  it('selected and non selected spec', () => {
    const selectStub = cy.stub()
    const unselectedSpec = {...spec, shortName: 'unselected.spec.js'}
    mount(
      <ul style={{ position: 'relative' }}>
        <SpecFileItem
          spec={{...spec, shortName: 'selected.spec.js'}}
          selected={true}
          onSelectSpec={selectStub}
        />
        <SpecFileItem
          spec={unselectedSpec}
          selected={false}
          onSelectSpec={selectStub}
        />
      </ul>
    )

    cy.get('[data-cy="selected-spec"]')
      .contains('selected.spec.js')

    cy.get('[data-cy="unselected-spec"]')
      .contains('unselected.spec.js')
      .click()
      .then(() => {
        expect(selectStub).to.have.been.calledWith(unselectedSpec)
      })

  })

  it('renders an empty list', () => {
    mount(
      <SpecList 
        hierarchy={files}
        selectedSpecs={[]}
        onSelectSpec={() => {}}
      />
    )
  })

  it('opens and closes folders', () => {
    mount(
      <SpecList 
        hierarchy={files}
        selectedSpecs={['component/shared/utils/transform.js']}
        onSelectSpec={() => {}}
      />
    )

    ;['bar.js', 'runner.js', 'spec-list.js'].forEach(spec => {
      cy.get(`[data-cy="spec-${spec}"]`).should('exist')
    })

    cy.get('[data-cy="selected-spec"]').contains('transform.js')
    cy.get('[data-cy="spec-folder-shared"]').click()

    ;['bar.js', 'runner.js', 'spec-list.js'].forEach(spec => {
      cy.get(`[data-cy="spec-${spec}"]`).should('not.exist')
    })
  })
})