import { expect } from 'chai'
import { makeSpecHierarchy, SpecFolderOrSpecFile } from './make-spec-hierarchy'

const baseVals: Cypress.Cypress['spec'] = {
  absolute: '/',
  relative: '/',
  name: '',
}

const files = [
  { ...baseVals, name: 'forOfStatement.js' },
  { ...baseVals, name: 'foo/y/bar.js' },
]

describe('makeSpecHierarchy', () => {
  it('works for a complex case', () => {
    const actual = makeSpecHierarchy(files)

    const expected: SpecFolderOrSpecFile[] = [
      {
        ...baseVals,
        name: 'forOfStatement.js',
        shortName: 'forOfStatement.js',
        type: 'file',
      },
      {
        shortName: 'foo',
        type: 'folder',
        specs: [
          {
            shortName: 'y',
            type: 'folder',
            specs: [
              {
                ...baseVals,
                shortName: 'bar.js',
                name: 'foo/y/bar.js',
                type: 'file',
              },
            ],
          },
        ],
      },
    ]

    expect(actual).to.eqls(expected)
  })
})
