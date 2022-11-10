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

const map: SpecMap = new Map()
let deleted: string[] = []

const defaults = { name: '', isLeaf: false, children: [], id: '', highlightIndexes: [] }

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = defaults): {tree: SpecTreeNode<T>, map: SpecMap} {
  specs.forEach((spec) => buildSpecTreeRecursive(spec.relative, root, spec))
  for (const m of deleted) {
    map.delete(m)
  }
  collapseEmptyChildren(root)

  return { tree: root, map }
}

export function buildSpecTreeRecursive<T extends FoundSpec> (path: string, tree: SpecTreeNode<T>, data?: T) {
  const [firstFile, ...rest] = path.split(getRegexSeparator())
  const splitFiles = path.split('/').filter((f) => f.length >= 1)
  const directories = splitFiles.slice(0, splitFiles.length - 1)
  //console.log({firstFile, rest})
  // console.log({directories})
  // console.log('hello')
  // console.log({map})
  // if (directories.length >= 1 && !map.has(directories.join('/'))) {
  //   map.set(directories.join('/'), [])
  // }
  //console.log({directories})
  const id = tree.id ? [tree.id, firstFile].join(getSeparator()) : firstFile

  // console.log({id})
  // console.log({map})
  if (directories.length >= 1 && !map.has(id)) {
    map.set(id, [])
  }

  const newNode: SpecTreeNode<T> = { name: firstFile, isLeaf: false, children: [], parent: null, data, id, highlightIndexes: [] }

  if (rest.length < 1) {
    newNode.isLeaf = true
    for (const key of map.keys()) {
      const alreadyExists = data?.relative.indexOf(key) ?? 0

      if (alreadyExists > 0) {
        const prevValue = map.get(key) ?? []
        const substring = data?.relative.substring(0, alreadyExists - 1) ?? ''
        const potentialVal = map.get(`${substring }/${ key}`) ?? []

        if (potentialVal) {
          map.set(`${substring }/${ key}`, [...prevValue, ...potentialVal])
          deleted.push(key)
        }
      }

      if (data?.relative.includes(key)) {
        const val = map.get(key) ?? []

        map.set(key, [...val, data])
      }
    }
    newNode.highlightIndexes = getHighlightIndexes(newNode)

    tree.children.push(newNode)

    return tree
  }

  //console.log({map})
  const foundChild = tree.children.find((child) => child.name === firstFile)

  if (foundChild) {
    buildSpecTreeRecursive(rest.join(getSeparator()), foundChild, data)

    return tree
  }

  newNode.highlightIndexes = getHighlightIndexes(newNode)
  const newTree = buildSpecTreeRecursive(rest.join(getSeparator()), newNode, data)

  tree.children.push(newTree)

  return tree
}

// function cleanTreeMapping<T extends FoundSpec> (node: SpecTreeNode<T>, data) {
//   for (const key of map.keys()) {
//     const alreadyExists = data?.relative.indexOf(key)
//     if (alreadyExists) {
//       // you need to check if it exists before or after
//       const prevValue = map.get(key) ?? []
//       const substring = data?.relative.substring(0, alreadyExists - 1) ?? ''
//       console.log({substring})
//       const potentialVal = map.get(substring + "/" + key) ?? []
//       console.log({potentialVal})
//       if (potentialVal) {
//         map.set(substring, [...prevValue, ...potentialVal])
//         map.delete(key)
//       }
//     }
//   }
// }

function collapseEmptyChildren<T extends FoundSpec> (node: SpecTreeNode<T>) {
  for (const child of node.children) {
    collapseEmptyChildren(child)
  }
  if (node.isLeaf) {
    return
  }

  // Root name of our tree is '/'. We don't want to collapse into the root node
  // so we check node.parent.parent
  if (node.parent && node.parent.parent && (node.parent.children.length === 1)) {
    node.parent.name = [node.parent.name, node.name].join(getSeparator())
    node.parent.id = [node.parent.id, node.name].join(getSeparator())
    node.parent.children = node.children
    node.parent.highlightIndexes = getHighlightIndexes(node.parent)
  }

  return
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
