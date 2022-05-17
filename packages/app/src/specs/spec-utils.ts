import fuzzySort from 'fuzzysort'
import type { FoundSpec } from '@packages/types'
import { ComputedRef, Ref, ref, watch } from 'vue'
import _ from 'lodash'
import type { UseCollapsibleTreeNode } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
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
  fileIndexes: number[]
  dirIndexes: number[]
}

export type SpecTreeNode<T extends FoundSpec = FoundSpec> = {
  id: string
  name: string
  children: SpecTreeNode<T>[]
  isLeaf: boolean
  parent?: SpecTreeNode<T>
  data?: T
}

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = { name: '', isLeaf: false, children: [], id: '' }) {
  specs.forEach((spec) => buildSpecTreeRecursive(spec.relative, root, spec))
  collapseEmptyChildren(root)

  return root
}

export function buildSpecTreeRecursive<T extends FoundSpec> (path: string, tree: SpecTreeNode<T>, data?: T) {
  const [firstFile, ...rest] = path.split(getRegexSeparator())
  const id = tree.id ? [tree.id, firstFile].join(getSeparator()) : firstFile

  if (rest.length < 1) {
    tree.children.push({ name: firstFile, isLeaf: true, children: [], parent: tree, data, id })

    return tree
  }

  const foundChild = tree.children.find((child) => child.name === firstFile)

  if (foundChild) {
    buildSpecTreeRecursive(rest.join(getSeparator()), foundChild, data)

    return tree
  }

  const newTree = buildSpecTreeRecursive(rest.join(getSeparator()), { name: firstFile, isLeaf: false, children: [], parent: tree, id, data }, data)

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
  }

  return
}

export function getDirIndexes (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>) {
  const indexes = row.data?.dirIndexes ?? []

  const maxIndex = row.id.length - 1
  const minIndex = maxIndex - row.name.length + 1

  const res = indexes.filter((index) => index >= minIndex && index <= maxIndex)

  return res.map((idx) => idx - minIndex)
}

export function fuzzySortSpecs <T extends FuzzyFoundSpec> (specs: T[], searchValue: string) {
  const transformedSpecs = addDirectoryToSpecs(specs)

  return fuzzySort
  .go(searchValue, transformedSpecs, { keys: ['baseName', 'directory'], allowTypo: false })
  .map((result) => {
    const [file, dir] = result

    return {
      ...result.obj,
      fileIndexes: file?.indexes ?? [],
      dirIndexes: dir?.indexes ?? [],
    }
  }) as FuzzyFoundSpec[]
}

function addDirectoryToSpecs <T extends FuzzyFoundSpec> (specs: Partial<T>[]) {
  return specs.map((spec) => {
    return {
      ...spec,
      directory: getDirectoryPath(spec?.relative ?? ''),
    }
  })
}

function getDirectoryPath (path: string) {
  return path.slice(0, path.lastIndexOf(getSeparator()))
}

export function makeFuzzyFoundSpec (spec: FoundSpec): FuzzyFoundSpec {
  return {
    ...spec,
    fileIndexes: [],
    dirIndexes: [],
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
