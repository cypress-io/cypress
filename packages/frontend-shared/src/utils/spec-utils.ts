import fuzzySort from 'fuzzysort'
import type { FoundSpec } from '@packages/types'
import { ref, watch } from 'vue'
import type { UseCollapsibleTreeNode } from '../composables/useCollapsibleTree'

const PATH_SEP = /[\/\\]/

export type FuzzyFoundSpec = FoundSpec & {
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
  const [firstFile, ...rest] = path.split(PATH_SEP)
  const id = tree.id ? [tree.id, firstFile].join('/') : firstFile

  if (rest.length < 1) {
    tree.children.push({ name: firstFile, isLeaf: true, children: [], parent: tree, data, id })

    return tree
  }

  const foundChild = tree.children.find((child) => child.name === firstFile)

  if (foundChild) {
    buildSpecTreeRecursive(rest.join('/'), foundChild, data)

    return tree
  }

  const newTree = buildSpecTreeRecursive(rest.join('/'), { name: firstFile, isLeaf: false, children: [], parent: tree, id, data }, data)

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
    node.parent.name = [node.parent.name, node.name].join('/')
    node.parent.id = [node.parent.id, node.name].join('/')
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

export function fuzzySortSpecs (specs: FuzzyFoundSpec[], searchValue: string) {
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

function addDirectoryToSpecs (specs: Partial<FuzzyFoundSpec>[]) {
  return specs.map((spec) => {
    return {
      ...spec,
      directory: getDirectoryPath(spec?.relative ?? ''),
    }
  })
}

function getDirectoryPath (path: string) {
  return path.slice(0, path.lastIndexOf('/') ?? path.lastIndexOf('\\'))
}

export function makeFuzzyFoundSpec (spec: FoundSpec): FuzzyFoundSpec {
  return {
    ...spec,
    fileIndexes: [],
    dirIndexes: [],
  }
}

export function useCachedSpecs (specs) {
  const cachedSpecs = ref<FoundSpec[]>([])

  watch(specs, (currentSpecs: FoundSpec[], prevSpecs: FoundSpec[] = []) => {
    const specsAreDifferent =
        currentSpecs.length !== prevSpecs.length ||
        currentSpecs.some(
          (spec, idx) => spec.absolute !== prevSpecs[idx]?.absolute,
        )

    if (specsAreDifferent) {
      cachedSpecs.value = currentSpecs
    }
  }, { immediate: true })

  return cachedSpecs
}
