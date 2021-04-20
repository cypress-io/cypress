import { FocusScope } from '@react-aria/focus'
import React, {
  useEffect,
  useRef,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeTree } from 'react-vtree'

import { useCombinedRefs } from '../../hooks/useCombinedRefs'

import {
  isParent,
  LeafTreeBase,
  ParentTreeBase,
  TreeNode,
  TreeNodeData,
  VirtualizedTreeProps,
} from './types'
import { TreeChild } from './VirtualizedTreeChild'

export const VirtualizedTree = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    treeRef,
    tree,
    defaultItemSize,
    overscanCount = 20,
    indentSize,
    showRoot,
    onNodePress,
    onRenderLeaf,
    onRenderParent,
    ...props
  }: VirtualizedTreeProps<TLeaf, TParent>) => {
  const internalRef = useRef<VariableSizeTree<
    TreeNodeData<TLeaf, TParent>
  > | null>(null)

  useCombinedRefs(internalRef, treeRef ?? null)

  const buildNodeData = (node: TLeaf | TParent, nestingLevel: number, isFirst: boolean): TreeNode<TLeaf, TParent> => ({
    data: {
      id: node.id,
      node,
      nestingLevel,
      isOpenByDefault: true,
      defaultHeight: defaultItemSize,
      isFirst,
    },
  })

  function* treeWalker (): Generator<TreeNode<TLeaf, TParent> | undefined, undefined, TreeNode<TLeaf, TParent>> {
    if (showRoot) {
      yield buildNodeData(tree, 0, true)
    } else {
      // Push all children of root as many psuedo roots
      for (let i = 0; i < tree.children.length; i++) {
        yield buildNodeData(tree.children[i] as TLeaf | TParent, 0, i === 0)
      }
    }

    while (true) {
      const parent = yield

      if (!isParent(parent.data.node)) {
        continue
      }

      for (const child of parent.data.node.children) {
        yield buildNodeData(child as TLeaf | TParent, parent.data.nestingLevel + 1, false)
      }
    }
  }

  useEffect(() => {
    internalRef.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    })
  }, [tree])

  return (
    <AutoSizer>
      {({ width, height }) => (
        <FocusScope>
          <VariableSizeTree<TreeNodeData<TLeaf, TParent>>
            {...props}
            ref={internalRef}
            treeWalker={treeWalker}
            width={width}
            height={height}
            overscanCount={overscanCount}
          >
            {(props) => (
              <TreeChild
                {...props}
                indentSize={indentSize}
                showRoot={showRoot}
                onNodePress={onNodePress}
                onRenderLeaf={onRenderLeaf}
                onRenderParent={onRenderParent}
              />
            )}
          </VariableSizeTree>
        </FocusScope>
      )}
    </AutoSizer>
  )
}
