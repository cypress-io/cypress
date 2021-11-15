import type { FoundSpec } from '@packages/types'

export type SpecTreeNode<T extends FoundSpec = FoundSpec> = {
  value: string
  children: SpecTreeNode<T>[]
  isLeaf: boolean
  parent?: SpecTreeNode<T>
  data?: T
}

export function buildSpecTree<T extends FoundSpec> (specs: FoundSpec[], root: SpecTreeNode<T> = { value: '/', isLeaf: false, children: [] }) {
  specs.forEach((spec) => buildSpecTreeRecursive(spec.relative, root, spec))

  collapseEmptyChildren(root)

  return root
}

export function buildSpecTreeRecursive<T extends FoundSpec> (path: string, tree: SpecTreeNode<T>, data?: T) {
  const [firstFile, ...rest] = path.split('/')

  if (rest.length < 1) {
    tree.children.push({ value: firstFile, isLeaf: true, children: [], parent: tree, data })

    return tree
  }

  const foundChild = tree.children.find((child) => child.value === firstFile)

  if (foundChild) {
    buildSpecTreeRecursive(rest.join('/'), foundChild, data)

    return tree
  }

  const newTree = buildSpecTreeRecursive(rest.join('/'), { value: firstFile, isLeaf: false, children: [], parent: tree }, data)

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

  // Root value of our tree is '/'. We don't want to collapse into the root node
  // so we check node.parent.parent
  if (node.parent && node.parent.parent && (node.parent.children.length === 1)) {
    node.parent.value = [node.parent.value, node.value].join('/')
    node.parent.children = node.children
  }

  return
}
