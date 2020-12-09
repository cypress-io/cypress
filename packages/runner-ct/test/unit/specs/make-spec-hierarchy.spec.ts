import { expect } from 'chai'

/**
 * Split specs into group by their
 * first level of folder hierarchy
 *
 * @param {Array<{name: string}>} specs
 */
interface FileSpec {
  type: 'file'
  name: string
}

interface FolderSpec {
  type: 'folder'
  name: string
  specs: Spec[]
}

type Spec = FileSpec | FolderSpec

function getAllFolders (specs: string[]): Record<string, FolderSpec> {
  return specs.reduce<Record<string, FolderSpec>>((acc, curr) => {
    const pathArr = curr.split('/')
    // it is a 'top level' spec
    // do nothing
    if (pathArr.length === 1) {
      return acc
    }
    const dir = pathArr.slice(0, -1).join('/')
    return {
      ...acc,
      [dir]: {
        type: 'folder',
        name: dir,
        specs: []
      }
    }
  }, {})
}

function makeSpecHierarchy (specs: Record<string, Spec>): Spec[] {
  // do it ...
  return []

  // return specs.reduce((groups, spec) => {
  // }, []
  // return specs.reduce((groups, spec) => {
  //   const pathArray = spec.name.split('/')

  //   let currentGroup = groups

  //   pathArray.forEach((pathPart, i) => {
  //     const tmpGroup = currentGroup[pathPart] || {}

  //     if (i < pathArray.length - 1) {
  //       currentGroup[pathPart] = tmpGroup
  //       currentGroup = tmpGroup
  //     } else {
  //       currentGroup[pathPart] = spec
  //     }
  //   })

  //   return groups
  // }, {})
}

it('getAllFolders', () => {
  const files = ['dir/foo.spec.js', 'dir/foo/bar.spec.js', 'dir/bar/qux.spec.js']
  const actual = getAllFolders(files)
  const expected: Record<string, FolderSpec> = {
    'dir': {
      name: 'dir',
      type: 'folder',
      specs: []

    },
    'dir/foo': {
      name: 'dir/foo',
      type: 'folder',
      specs: []
    },
    'dir/bar': {
      name: 'dir/bar',
      type: 'folder',
      specs: []
    }
  }
  expect(actual).to.eqls(expected)
})

it('complex example', () => {
  const files = ['dir/foo.spec.js', 'dir/foo/bar.spec.js', 'dir/bar/qux.spec.js']
  const actual = makeSpecHierarchy({
    'dir': {
      name: 'dir',
      type: 'folder',
      specs: []

    },
    'dir/foo': {
      name: 'dir/foo',
      type: 'folder',
      specs: []
    },
    'dir/bar': {
      name: 'dir/bar',
      type: 'folder',
      specs: []
    }
  })

  const expected: Spec[] = [
    {
      name: 'dir',
      type: 'folder',
      specs: [
        {
          type: 'file',
          name: 'foo.spec.js',
        },
        {
          name: 'foo',
          type: 'folder',
          specs: [
            {
              type: 'file',
              name: 'bar.spec.js',
            }
          ]
        },
        {
          name: 'bar',
          type: 'folder',
          specs: [
            {
              type: 'file',
              name: 'qux.spec.js',
            }
          ]
        }
      ]
    }
  ]

  expect(actual).to.eqls(expected)
})
