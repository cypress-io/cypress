import fuzzySort from 'fuzzysort'
import type { FoundSpec } from '@packages/types'
import { ComputedRef, Ref, ref, watch } from 'vue'
import _ from 'lodash'
import { getRunnerConfigFromWindow } from '../runner'

// Platform may not be available when this file is loaded (e.g. during component our component tests) so
// we defer loading it until it's used
let platform
const getPlatform = (): string => {
  if (!platform) {
    platform = getRunnerConfigFromWindow().platform
  }

  return platform
}
const getRegexSeparator = () => getPlatform() === 'win32' ? /\\/ : /\//
const getSeparator = () => getPlatform() === 'win32' ? '\\' : '/'

export type FuzzyFoundSpec<T = FoundSpec> = T & {
  fuzzyIndexes: {
    relative: number[]
    baseName: number[]
  }
}

export type SpecTreeNode<T extends FoundSpec = FoundSpec> = {
  id: string
  name: string
  children: SpecTreeNode<T>[]
  isLeaf: boolean
  parent?: SpecTreeNode<T>
  data?: T
  highlightIndexes: number[]
}

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = { name: '', isLeaf: false, children: [], id: '', highlightIndexes: [] }): SpecTreeNode<T> {
  specs.forEach((spec) => buildSpecTreeRecursive(spec.relative, root, spec))
  collapseEmptyChildren(root)

  return root
}

export function buildSpecTreeRecursive<T extends FoundSpec> (path: string, tree: SpecTreeNode<T>, data?: T) {
  const [firstFile, ...rest] = path.split(getRegexSeparator())
  const id = tree.id ? [tree.id, firstFile].join(getSeparator()) : firstFile

  const newNode: SpecTreeNode<T> = { name: firstFile, isLeaf: false, children: [], parent: tree, data, id, highlightIndexes: [] }

  if (rest.length < 1) {
    newNode.isLeaf = true
    newNode.highlightIndexes = getHighlightIndexes(newNode)

    tree.children.push(newNode)

    return tree
  }

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

export function fuzzySortSpecs <T extends FuzzyFoundSpec> (specs: T[], searchValue: string) {
  const normalizedSearchValue = getPlatform() === 'win32' ? searchValue.replaceAll('/', '\\') : searchValue

  const fuzzySortResult = fuzzySort
  .go(normalizedSearchValue, specs, { keys: ['relative', 'baseName'], allowTypo: false, threshold: -3000 })
  .map((result) => {
    const [relative, baseName] = result

    return {
      ...result.obj,
      fuzzyIndexes: {
        relative: relative?.indexes ?? [],
        baseName: baseName?.indexes ?? [],
      },
    }
  })

  return fuzzySortResult
}

export function makeFuzzyFoundSpec (spec: FoundSpec): FuzzyFoundSpec {
  return {
    ...spec,
    fuzzyIndexes: {
      relative: [],
      baseName: [],
    },
  }
}

export function useCachedSpecs<S extends { absolute: string }> (
  specs: ComputedRef<Readonly<S[]>>,
): Ref<Readonly<S[]>> {
  const cachedSpecs: Ref<Readonly<S[]>> = ref([])

  watch(specs, (currentSpecs, prevSpecs = []) => {
    if (!_.isEqual(currentSpecs, prevSpecs)) {
      cachedSpecs.value = currentSpecs
    }
  }, { immediate: true })

  return cachedSpecs
}

// Used to split indexes from a baseName match to a fileName + extension (with cy extension) match
// For example, given a filename of Button.cy.tsx:
// - search of 'Butcytsx' yields indexes [0,1,2,7,8,10,11,12]
// - deriveIndexes yields
//    {
//      fileNameIndexes: [0,1,2], // indexes to highlight in "Button"
//      extensionIndexes: [1,2,4,5,6] // indexes to highlight in ".cy.tsx"
//    }
export function deriveIndexes (fileName: string, indexes: number[]) {
  return indexes.reduce((acc, idx) => {
    if (idx < fileName.length) {
      acc.fileNameIndexes.push(idx)
    } else {
      acc.extensionIndexes.push(idx - fileName.length)
    }

    return acc
  }, { fileNameIndexes: <number[]>[], extensionIndexes: <number[]>[] })
}
