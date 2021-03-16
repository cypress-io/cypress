import {
  getAllFolders,
  makeFileHierarchy,
  FileNode
} from './makeFileHierarchy'
import { expect } from 'chai'

describe('makeSpecHierarchy', () => {
  it('getAllFolders', () => {
    const files: string[] = [
      'forOfStatement.js',
      'foo/y/bar.js',
      'foo/bar',
      'a/b/c',
    ]
    const actual = getAllFolders(files)
    expect(actual).to.have.members(['foo', 'foo/y', 'foo/bar', 'a', 'a/b', 'a/b/c'])
  })

  it('simple case', () => {
    const files: string[] = ['x/y/z.js']
    const actual = makeFileHierarchy(files)

    const expected: FileNode[] = [
      {
        name: 'x',
        absolute: 'x',
        type: 'folder',
        files: [
          {
            name: 'y',
            absolute: 'x/y',
            type: 'folder',
            files: [
              {
                name: 'z.js',
                type: 'file',
                absolute: 'x/y/z.js'
              }
            ],
          }
        ]
      }
    ]

    expect(actual).to.eql(expected)
  })

  it('works for a complex case', () => {
    const files: string[] = [
      'forOfStatement.js',
      'x',
      'x/y/z',
      'a/b/c/test1.js',
      'a/b/c/d/test2.js'
    ]
    const actual = makeFileHierarchy(files)


    const expected: FileNode[] = [
      {
        name: 'x',
        files: [
          {
            name: 'y',
            files: [
              {
                name: 'z',
                files: [],
                type: 'folder',
                absolute: 'x/y/z'
              }
            ],
            type: 'folder',
            absolute: 'x/y'
          }
        ],
        type: 'folder',
        absolute: 'x'
      },
      {
        name: 'a',
        files: [
          {
            name: 'b',
            files: [
              {
                name: 'c',
                files: [
                  {
                    name: 'd',
                    files: [
                      {
                        type: 'file',
                        name: 'test2.js',
                        absolute: 'a/b/c/d/test2.js'
                      }
                    ],
                    type: 'folder',
                    absolute: 'a/b/c/d'
                  },
                  {
                    type: 'file',
                    name: 'test1.js',
                    absolute: 'a/b/c/test1.js'
                  }
                ],
                type: 'folder',
                absolute: 'a/b/c'
              }
            ],
            type: 'folder',
            absolute: 'a/b'
          }
        ],
        type: 'folder',
        absolute: 'a'
      }
    ]

    expect(actual).to.eql(expected)
  })
})
