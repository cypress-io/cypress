import { ComputedRef, computed, Ref, ref } from 'vue'
import { useToggle } from '@vueuse/core'

export interface UseCollapsibleTreeNode {
  [key: string]: any

  // make all parents open themselves
  reveal: () => UseCollapsibleTreeNode[]

  // control open/close state
  hidden: ComputedRef<boolean>
  expanded: Ref<boolean>
  expand: () => boolean
  collapse: () => boolean
  toggleCollapsed: () => void

  // Depth of a particular node -- 1 indexed
  depth: number

  parent?: UseCollapsibleTreeNode
  children?: UseCollapsibleTreeNode[]
}

function collectRoots (node, acc: UseCollapsibleTreeNode[] = []) {
  acc.push(node)
  if (!node.parent) {
    return acc
  }

  collectRoots(node.parent, acc)

  return acc
}

export const useCollapsibleTreeNode = (rawNode, options, depth, parent) => {
  const roots = parent ? collectRoots(parent) : []
  const [expanded, toggle] = useToggle(!!options.expandInitially)
  const hidden = computed(() => {
    return roots.find((r) => r.expanded.value === false)
  })

  const reveal = () => {
    expanded.value = false
    const parentNodes = collectRoots(parent)

    for (const parentNode of parentNodes) {
      parentNode.expand()
    }

    return parentNodes
  }

  return {
    ...rawNode,
    depth,
    parent,
    hidden,
    expanded,
    reveal,
    expand: () => expanded.value = true,
    collapse: () => expanded.value = false,
    toggle,
  }
}

function buildTree (rawNode, options, acc: UseCollapsibleTreeNode[] = [], depth = 1, parent = null) {
  const node = useCollapsibleTreeNode(rawNode, options, depth, parent)

  acc.push(node)

  if (node.children?.length) {
    for (const child of node.children) {
      buildTree(child, options, acc, depth + 1, node)
    }
  }

  return acc
}

export function useCollapsibleTree (tree, options = {}) {
  options.expandInitially = options.expandInitially || true
  const collapsibleTree = buildTree(tree, options)

  const expand = (matches?) => {
    if (typeof matches === 'function') {
      collapsibleTree.filter(matches).forEach((node) => node.expand())
    } else {
      collapsibleTree.forEach((node) => node.expand())
    }
  }

  const collapse = (matches?) => {
    if (typeof matches === 'function') {
      collapsibleTree.filter(matches).forEach((node) => node.collapse())
    } else {
      collapsibleTree.forEach((node) => node.collapse())
    }
  }

  const reveal = (matches?) => {
    if (typeof matches === 'function') {
      const nodes: typeof collapsibleTree = matches ? collapsibleTree.filter(matches) : []

      nodes.forEach((node) => node.reveal())

      return nodes
    }
  }

  return {
    tree: collapsibleTree,
    reveal,
    expand,
    collapse,
  }
}
