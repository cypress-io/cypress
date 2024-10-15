import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import { useToggle } from '@vueuse/core'
import type { FoundSpec } from '@packages/types/src'
import { getRunnerConfigFromWindow } from '../../runner/get-runner-config-from-window'

export type RawNode <T> = {
  id: string
  name: string
  children: RawNode<T>[]
}

export type FuzzyFoundSpec<T = FoundSpec> = T & {
  normalizedBaseName: string
  normalizedRelative: string
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

// Platform may not be available when this file is loaded (e.g. during component our component tests) so
// we defer loading it until it's used
let platform: string

export const getPlatform = (): string => {
  if (!platform) {
    platform = getRunnerConfigFromWindow().platform
  }

  return platform
}

const getRegexSeparator = () => getPlatform() === 'win32' ? /\\/ : /\//

export const getSeparator = () => getPlatform() === 'win32' ? '\\' : '/'

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = { name: '', isLeaf: false, children: [], id: '', highlightIndexes: [] }): SpecTreeNode<T> {
  specs.forEach((spec) => buildSpecTreeRecursive(spec.relative, root, spec))
  collapseEmptyChildren(root)

  return root
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

export type UseCollapsibleTreeNode <T extends RawNode<T>> = {
  // control open/close state
  hidden: ComputedRef<boolean>
  expanded: Ref<boolean>
  toggle: () => void

  // Depth of a particular node -- 1 indexed
  depth: number

  parent?: UseCollapsibleTreeNode<T>
  children: UseCollapsibleTreeNode<T>[]
} & { [K in keyof T]: T[K]}

export interface UseCollapsibleTreeOptions {
  expandInitially?: boolean
  dropRoot?: boolean
  /**
   * Provide a long-lived cache to preserve directory collapse state across tree re-builds.
   * This can be useful when row data is updating but doesn't represent a change to the
   * structure of the tree.
   */
  cache?: Map<string, boolean>
}

function collectRoots<T extends RawNode<T>> (node: UseCollapsibleTreeNode<T> | null, acc: UseCollapsibleTreeNode<T>[] = []) {
  if (!node || !node.parent) {
    return acc
  }

  acc.push(node)

  collectRoots<T>(node.parent, acc)

  return acc
}

export const useCollapsibleTreeNode = <T extends RawNode<T>>(rawNode: T, options: UseCollapsibleTreeOptions, depth: number, parent: UseCollapsibleTreeNode<T> | null): UseCollapsibleTreeNode<T> => {
  const { cache, expandInitially } = options
  const treeNode = rawNode as UseCollapsibleTreeNode<T>
  const roots = parent ? collectRoots<T>(parent) : []
  const [expanded, toggle] = useToggle(cache?.get(rawNode.id) ?? !!expandInitially)

  const hidden = computed(() => {
    return !!roots.find((r) => r.expanded.value === false)
  })

  const wrappedToggle = (value?: boolean): boolean => {
    const originalState = expanded.value
    const newValue = toggle(value)

    // If this is a non-hidden directory then watch for expansion changes and register them into the cache if one was provided
    if (!!cache && !hidden.value && rawNode.children?.length) {
      cache.set(rawNode.id, !originalState)
    }

    return newValue
  }

  return {
    ...treeNode,
    depth,
    parent,
    hidden,
    expanded,
    toggle: wrappedToggle,
  }
}

function buildTree<T extends RawNode<T>> (
  rawNode: T,
  options: UseCollapsibleTreeOptions,
  acc: UseCollapsibleTreeNode<T>[] = [],
  depth = 1,
  parent: UseCollapsibleTreeNode<T> | null = null,
) {
  // console.log(arguments)
  const node = useCollapsibleTreeNode<T>(rawNode, options, depth, parent)

  acc.push(node)

  if (node.children?.length) {
    for (const child of node.children) {
      buildTree(child, options, acc, depth + 1, node)
    }
  }

  return acc
}

function sortTree<T extends RawNode<T>> (tree: T) {
  if (tree.children.length > 0) {
    tree.children = tree.children.sort((a, b) => {
      if (a.children.length === 0 && b.children.length === 0) {
        return a.name > b.name ? 1 : -1
      }

      if (a.children.length === 0) {
        return 1
      }

      if (b.children.length === 0) {
        return -1
      }

      return a.name > b.name ? 1 : -1
    })

    tree.children.forEach(sortTree)
  }
}

export function useCollapsibleTree <T extends RawNode<T>> (tree: T, options: UseCollapsibleTreeOptions = {}) {
  options.expandInitially = options.expandInitially ?? true
  sortTree(tree)
  const collapsibleTree = buildTree<T>(tree, options)

  collapsibleTree.sort((a, b) => {
    if (a.parent === b.parent) {
      if (a.children.length && !b.children.length) {
        return -1
      }

      return 0
    }

    return 0
  })

  return {
    tree: options.dropRoot ? collapsibleTree.slice(1) : collapsibleTree,
  }
}
