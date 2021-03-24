import {
  getAllFolders,
  makeFileHierarchy,
  TreeNode,
} from './makeFileHierarchy'
import { expect } from 'chai'

describe('makeFileHierarchy', () => {
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

    const expected: TreeNode[] = [
      {
        name: 'x',
        relative: 'x',
        type: 'folder',
        files: [
          {
            name: 'y',
            relative: 'x/y',
            type: 'folder',
            files: [
              {
                name: 'z.js',
                type: 'file',
                relative: 'x/y/z.js',
              },
            ],
          },
        ],
      },
    ]

    expect(actual).to.eql(expected)
  })

  it('handles case of no files or folders', () => {
    const actual = makeFileHierarchy([])

    expect(actual).to.have.members([])
  })

  it('works for a complex case', () => {
    const files: string[] = [
      'forOfStatement.js',
      'x',
      'x/y/z',
      'a/b/c/test1.js',
      'a/b/c/d/test2.js',
    ]
    const actual = makeFileHierarchy(files)

    const expected: TreeNode[] = [
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
                relative: 'x/y/z',
              },
            ],
            type: 'folder',
            relative: 'x/y',
          },
        ],
        type: 'folder',
        relative: 'x',
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
                        relative: 'a/b/c/d/test2.js',
                      },
                    ],
                    type: 'folder',
                    relative: 'a/b/c/d',
                  },
                  {
                    type: 'file',
                    name: 'test1.js',
                    relative: 'a/b/c/test1.js',
                  },
                ],
                type: 'folder',
                relative: 'a/b/c',
              },
            ],
            type: 'folder',
            relative: 'a/b',
          },
        ],
        type: 'folder',
        relative: 'a',
      },
    ]

    expect(actual).to.eql(expected)
  })
})
