import { expect } from 'chai'
import { makeSpecHierarchy, SpecFolderOrSpecFile } from './make-spec-hierarchy'

const files = [
  { name: 'forOfStatement.js' },
  { name: 'foo/y/bar.js' },
]

describe('makeSpecHierarchy', () => {
  it('works for a complex case', () => {
    const actual = makeSpecHierarchy(files)

    const expected: SpecFolderOrSpecFile[] = [
      {
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
