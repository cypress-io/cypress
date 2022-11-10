import type { FoundSpec } from '@packages/types'

export type SpecMap = Map<string, FoundSpec[]>

export type SpecTreeNode<T extends FoundSpec = FoundSpec> = {
  id: string
  name: string
  children: SpecTreeNode<T>[]
  isLeaf: boolean
  parent?: SpecTreeNode<T>
  data?: T
  highlightIndexes: number[]
}

export type FuzzyFoundSpec<T = FoundSpec> = T & {
  fuzzyIndexes: {
    relative: number[]
    baseName: number[]
  }
}

const getRegexSeparator = () => /\//
const getSeparator = () => '/'

const defaults = { name: '', isLeaf: false, children: [], id: '', highlightIndexes: [] }

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = defaults): {tree: SpecTreeNode<T>, map: DirectoryMap} {
  const dirMap = getDirectoryMap(specs)

  specs.forEach((spec) => buildSpecTreeRecursive(dirMap, spec.relative, root, spec))

  return { tree: root, map: dirMap }
}

type DirectoryMap = Map<string, FoundSpec[]>

export function getDirectoryMap (specs: FoundSpec[], sep = '/'): DirectoryMap {
  const dirMap: DirectoryMap = new Map()

  for (const spec of specs) {
    let split = spec.relative.split(sep)

    split = split.slice(0, split.length - 1)

    let acc: string[] = []

    for (let i = 0; i < split.length; i++) {
      acc.push(split[i])
      dirMap.set(acc.join(sep), [])
    }
  }

  return dirMap
}

export function buildSpecTreeRecursive<T extends FoundSpec> (map: DirectoryMap, path: string, tree: SpecTreeNode<T>, data?: T): SpecTreeNode<T> {
  const [firstFile, ...rest] = path.split(getRegexSeparator())
  const id = tree.id ? [tree.id, firstFile].join(getSeparator()) : firstFile

  const newNode: SpecTreeNode<T> = { name: firstFile, isLeaf: false, children: [], parent: null, data, id, highlightIndexes: [] }

  if (rest.length < 1) {
    newNode.isLeaf = true
    for (const [key, val] of map.entries()) {
      if (data?.relative.includes(key)) {
        map.set(key, [...val, data])
      }
    }
    newNode.highlightIndexes = getHighlightIndexes(newNode)

    tree.children.push(newNode)

    return tree
  }

  const foundChild = tree.children.find((child) => child.name === firstFile)

  if (foundChild) {
    buildSpecTreeRecursive(map, rest.join(getSeparator()), foundChild, data)

    return tree
  }

  newNode.highlightIndexes = getHighlightIndexes(newNode)
  const newTree = buildSpecTreeRecursive(map, rest.join(getSeparator()), newNode, data)

  tree.children.push(newTree)

  return tree
}

// Given a node, return the indexes of the characters that should be highlighted
// The indexes are matched to the `relative` and `baseName` keys of FoundSpec, and
// depending on whether the node is a leaf or not, the indexes are normalized to the position
// of the node's location in the tree.
// If a search of "src/comp" is given with indexes [0,1,2,3,4,5,6,7], the indexes will be split
// into [0,1,2] and [4,5,6,7] corresponding with a
// - src
//   - components
//     - index.ts
// tree (given that src/comp is not collapsed)
function getHighlightIndexes <T extends FoundSpec> (node: SpecTreeNode<T>) {
  if (!(node.data as any)?.fuzzyIndexes) {
    return []
  }

  const { relative: relativeIndexes, baseName: baseNameIndexes } = (node.data as FuzzyFoundSpec<T>).fuzzyIndexes

  // When there is a full (or close to) relative match, baseName will no longer match.
  // If we have indexes for baseName we show them, otherwise we pull from relative to derive
  // baseName indexes
  if (node.isLeaf && baseNameIndexes.length > 0) {
    return baseNameIndexes
  }

  const maxIndex = node.id.length - 1
  const minIndex = maxIndex - node.name.length + 1

  const res = relativeIndexes.filter((index) => index >= minIndex && index <= maxIndex)

  return res.map((idx) => idx - minIndex)
}

// change to set
