import { buildSpecTree, getDirectoryMap, buildSpecTreeRecursive } from '../specsBackend/buildtree'
import { it, describe, expect } from 'vitest'
import type { FoundSpec } from '@packages/types/src'

function createSpec (path: string, name: string): FoundSpec {
  return {
    baseName: `${name}.cy.js`,
    fileExtension: '.js',
    fileName: name,
    name,
    relative: `${path}/${name}.cy.js`,
    specFileExtension: '.cy.js',
    specType: 'integration',
    absolute: `/${path}/${name}.cy.js`,
  }
}

const nested1 = createSpec('hello', 'foo')
const nested2 = createSpec('hello/cypress', 'bar')
const nested3 = createSpec('hello/cypress/e2e', 'cow')

describe('getDirectoryMap', () => {
  it('works', () => {
    const actual = getDirectoryMap([nested1, nested2, nested3])

    expect(actual).toMatchInlineSnapshot(`
      Map {
        "hello" => [],
        "hello/cypress" => [],
        "hello/cypress/e2e" => [],
      }
    `)
  })
})

describe('only test', () => {
  it('handles simple case', () => {
    const result = buildSpecTree([nested1])

    expect(result.map.get('hello')).toEqual([nested1])
  })

  it('two specs', () => {
    const result = buildSpecTree([nested1, nested3])

    expect(result.map.get('hello')).toEqual([nested1, nested3])
    expect(result.map.get('hello/cypress')).toEqual([nested3])
  })

  it('three specs', () => {
    const result = buildSpecTree([nested1, nested2, nested3])

    expect(result.map.get('hello')).toEqual([nested1, nested2, nested3])
    expect(result.map.get('hello/cypress')).toEqual([nested2, nested3])
    expect(result.map.get('hello/cypress/e2e')).toEqual([nested3])
  })

  function sort (specs: FoundSpec[] = []) {
    return specs.sort((x, y) => x.relative.length - y.relative.length)
  }

  it('is not dependent on the order', () => {
    const result = buildSpecTree([nested2, nested3, nested1])

    expect(sort(result.map.get('hello'))).toEqual([nested1, nested2, nested3])
    expect(sort(result.map.get('hello/cypress'))).toEqual([nested2, nested3])
    expect(sort(result.map.get('hello/cypress/e2e'))).toEqual([nested3])
  })
})

const defaults = { name: '', isLeaf: false, children: [], id: '', highlightIndexes: [] }

// export type SpecTreeNode<T extends FoundSpec = FoundSpec> = {
//   id: string
//   name: string
//   children: SpecTreeNode<T>[]
//   isLeaf: boolean
//   parent?: SpecTreeNode<T>
//   data?: T
//   highlightIndexes: number[]
// }

describe('buildSpecTreeRecusive', () => {
  it('????', () => {
    const map = getDirectoryMap([nested1])
    const result = buildSpecTreeRecursive(map, nested1.relative, defaults, nested1)

    const { children: helloChild, ...rest } = result

    expect(rest).toEqual({
      id: '',
      'highlightIndexes': [],
      'isLeaf': false,
      'name': '',
    })

    const { children: fooChild, ...data } = helloChild[0]

    expect(data).toEqual({
      name: 'hello',
      isLeaf: false,
      parent: null,
      data: {
        baseName: 'foo.cy.js',
        fileExtension: '.js',
        fileName: 'foo',
        name: 'foo',
        relative: 'hello/foo.cy.js',
        specFileExtension: '.cy.js',
        specType: 'integration',
        absolute: '/hello/foo.cy.js',
      },
      id: 'hello',
      highlightIndexes: [],
    })

    expect(fooChild).toEqual([{
      'children': [],
      'data': {
        'absolute': '/hello/foo.cy.js',
        'baseName': 'foo.cy.js',
        'fileExtension': '.js',
        'fileName': 'foo',
        'name': 'foo',
        'relative': 'hello/foo.cy.js',
        'specFileExtension': '.cy.js',
        'specType': 'integration',
      },
      'highlightIndexes': [],
      'id': 'hello/foo.cy.js',
      'isLeaf': true,
      'name': 'foo.cy.js',
      'parent': null,
    }])
    // name: 'foo',
    // isLeaf: false,
    // parent: null,
    // data: {
    //   baseName: 'foo.cy.js',
    //   fileExtension: '.js',
    //   fileName: 'foo',
    //   name: 'foo',
    //   relative: 'hello/foo.cy.js',
    //   specFileExtension: '.cy.js',
    //   specType: 'integration',
    //   absolute: '/hello/foo.cy.js'
    // },
    // id: 'hello',
    // highlightIndexes: []
  })
})
