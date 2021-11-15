import { ComputedRef, computed, Ref } from 'vue'
import { useToggle } from '@vueuse/core'

export type RawNode <T> = {
  name: string
  children: RawNode<T>[]
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
  const treeNode = rawNode as UseCollapsibleTreeNode<T>
  const roots = parent ? collectRoots<T>(parent) : []
  const [expanded, toggle] = useToggle(!!options.expandInitially)
  const hidden = computed(() => {
    return !!roots.find((r) => r.expanded.value === false)
  })

  return {
    ...treeNode,
    depth,
    parent,
    hidden,
    expanded,
    toggle,
  }
}

function buildTree<T extends RawNode<T>> (rawNode: T, options: UseCollapsibleTreeOptions, acc: UseCollapsibleTreeNode<T>[] = [], depth = 1, parent: UseCollapsibleTreeNode<T> | null = null) {
  const node = useCollapsibleTreeNode<T>(rawNode, options, depth, parent)

  acc.push(node)

  if (node.children?.length) {
    for (const child of node.children) {
      buildTree(child, options, acc, depth + 1, node)
    }
  }

  return acc
}

export function useCollapsibleTree <T extends RawNode<T>> (tree: T, options: UseCollapsibleTreeOptions = {}) {
  options.expandInitially = options.expandInitially || true
  const collapsibleTree = buildTree<T>(tree, options)

  return {
    tree: options.dropRoot ? collapsibleTree.slice(1) : collapsibleTree,
  }
}
